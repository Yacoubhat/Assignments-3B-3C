(() => {
    const margin = { top: 40, right: 170, bottom: 70, left: 80 };

    const outerWidth = 950;
    const outerHeight = 600;

    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;
    const container = d3.select(".connected-scatterPlot");

    container.selectAll("*").remove();

    const svg = container
        .append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
        .attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`);

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // ------------------------------------------
    // TOOLTIP INITIALIZATION
    // ------------------------------------------
    d3.selectAll(".connected-scatter-tooltip").remove();

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "connected-scatter-tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.85)")
        .style("color", "white")
        .style("padding", "8px 10px")
        .style("border-radius", "4px")
        .style("font-size", "13px");

    // ------------------------------------------
    // LOAD DATA
    // ------------------------------------------
    d3.csv("data/health_data_merged.csv").then(data => {

        data.forEach(d => {
            d.Year = +d.Year;
            d.expenditure = +d["Health Expenditure Share of ppp per capita"];
            d.lifeExpectancy = +d["Life Expectancy"];
        });

        // country to start
        const defaultCountryCodes = [
            "USA", "CHN", "DEU", "JPN", "AUS", "ZAF", "SWE", "IND", "CHE", "NOR"
        ]

        // Filter valid data
        const validData = data.filter(d =>
            d.Country && Number.isFinite(d.Year) &&
            Number.isFinite(d.expenditure) && d.expenditure > 0 &&
            Number.isFinite(d.lifeExpectancy) && d.lifeExpectancy > 0
        );

        // Get all unique countries
        const countries = Array.from(new Set(validData.map(d => d.Country))).sort((a, b) => a.localeCompare(b));

        console.log("Countries:", countries);

        // Consistent country colours
        const colour = d3.scaleOrdinal()
            .domain(countries)
            .range(d3.quantize(d3.interpolateRainbow, countries.length));

        // ------------------------------------------
        // FIXED X AND Y SCALES
        // ------------------------------------------
        const x = d3.scaleLinear()
            .domain([0, d3.max(validData, d => d.expenditure) * 1.05])
            .nice()
            .range([0, width]);

        const yMin = d3.min(validData, d => d.lifeExpectancy);
        const yMax = d3.max(validData, d => d.lifeExpectancy);

        const y = d3.scaleLinear()
            .domain([yMin - 2, yMax + 2])
            .nice()
            .range([height, 0]);

        // ------------------------------------------
        // GRIDLINES & AXES
        // ------------------------------------------
        chart.append("g")
            .attr("class", "grid x-grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(-height).tickFormat(""));

        chart.append("g")
            .attr("class", "grid y-grid")
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        // Make grid subtle
        chart.selectAll(".grid line")
            .attr("stroke", "#cccccc")
            .attr("stroke-opacity", 0.25)
            .attr("stroke-width", 0.7);

        chart.selectAll(".grid .domain").remove();

        chart.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        chart.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // X AXIS LABEL
        svg.append("text")
            .attr("x", margin.left + width / 2)
            .attr("y", outerHeight - 20)
            .attr("text-anchor", "middle")
            .text("Health Expenditure (PPP per capita)");

        // Y AXIS LABEL
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(margin.top + height / 2))
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .text("Life Expectancy (Years)");

        const line = d3.line()
            .x(d => x(d.expenditure))
            .y(d => y(d.lifeExpectancy));

        // ------------------------------------------
        // COUNTRY CHECKBOX LIST
        // ------------------------------------------
        const countryList = d3.select("#country-list");
        countryList.selectAll("*").remove();

        const countryItems = countryList
            .selectAll(".country-option")
            .data(countries)
            .join("label")
            .attr("class", "country-option");

        countryItems.append("input")
            .attr("type", "checkbox")
            .attr("class", "country-checkbox")
            .attr("value", d => d);

        countryItems.append("span")
            .text(d => d);

        // Default selections
        const defaultCountries = [...new Set(validData.filter(d => defaultCountryCodes.includes(d["Country Code"])).map(d => d.Country))];

        d3.selectAll(".country-checkbox")
            .property("checked", d => defaultCountries.includes(d));

        function getSelectedCountries() {
            const selected = [];
            d3.selectAll(".country-checkbox").each(function(d) {
                if (this.checked) {
                    selected.push(d);
                }
            });
            return selected;
        }

        // ------------------------------------------
        // UPDATE CHART FUNCTION
        // ------------------------------------------
        function updateChart() {
            const selectedCountries = getSelectedCountries();

            // Clear previous layers
            chart.selectAll(".country-trajectory").remove();
            chart.selectAll(".trajectory-point").remove();
            chart.selectAll(".country-label").remove();

            if (selectedCountries.length === 0) return;

            const selectedData = validData.filter(d => selectedCountries.includes(d.Country));

            const groupedData = d3.group(selectedData, d => d.Country);
            groupedData.forEach(countryData => {
                countryData.sort((a, b) => a.Year - b.Year);
            });

            // DRAW COUNTRY LINES
            groupedData.forEach((countryData, country) => {
                chart.append("path")
                    .datum(countryData)
                    .attr("class", "country-trajectory")
                    .attr("fill", "none")
                    .attr("stroke", colour(country))
                    .attr("stroke-width", 2.5)
                    .attr("stroke-opacity", 0.8)
                    .attr("d", line);
            });

            // DRAW DATA POINTS
            chart.selectAll(".trajectory-point")
                .data(selectedData)
                .join("circle")
                .attr("class", "trajectory-point")
                .attr("cx", d => x(d.expenditure))
                .attr("cy", d => y(d.lifeExpectancy))
                .attr("r", 3.5)
                .attr("fill", d => colour(d.Country))
                .attr("stroke", "white")
                .attr("stroke-width", 0.6)
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("r", 7);

                    tooltip
                        .style("opacity", 1)
                        .html(`
                            <strong>${d.Country}</strong><br>
                            Year: ${d.Year}<br>
                            Expenditure: ${d.expenditure.toFixed(2)}<br>
                            Life expectancy: ${d.lifeExpectancy.toFixed(1)} years
                        `);
                })
                .on("mousemove", function(event) {
                    tooltip
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 25}px`); // Syntax error fixed here
                })
                .on("mouseout", function() {
                    d3.select(this).attr("r", 3.5);
                    tooltip.style("opacity", 0);
                });

            // COUNTRY LABEL AT END OF TRAJECTORY
            groupedData.forEach((countryData, country) => {
                const lastPoint = countryData[countryData.length - 1];

                chart.append("text")
                    .attr("class", "country-label")
                    .attr("x", x(lastPoint.expenditure) + 7)
                    .attr("y", y(lastPoint.lifeExpectancy))
                    .attr("fill", colour(country))
                    .attr("font-size", 11)
                    .attr("font-weight", 600)
                    .attr("dominant-baseline", "middle")
                    .text(country);
            });
        }

        // ------------------------------------------
        // EVENT LISTENERS
        // ------------------------------------------
        d3.selectAll(".country-checkbox").on("change", updateChart);

        d3.select("#select-all-countries").on("click", function() {
            d3.selectAll(".country-checkbox").property("checked", true);
            updateChart();
        });

        d3.select("#clear-all-countries").on("click", function() {
            d3.selectAll(".country-checkbox").property("checked", false);
            updateChart();
        });

        updateChart();
    });
})();