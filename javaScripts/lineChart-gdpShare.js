(() => {
    const width = 950;
    const height = 500;

    const margin = {
        top: 35,
        right: 150,
        bottom: 45,
        left: 55
    };

   
    const svg = d3.select(".lineChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("max-width", "100%")
        .style("height", "auto");

    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

    const lineGroup = svg.append("g")
        .attr("class", "country-lines");

    const labelGroup = svg.append("g")
        .attr("class", "country-labels");

    //load merged health data
    d3.csv("data/cleaned-health-expenditure-share-gdp.csv").then(data => {
        
        data.forEach(d => {
            d.year = +d.Year;
            d.country = d["Country"];
            d.percentage = +d["Public health expenditure as a share of GDP"];
        });

        const cleanData = data.filter(d =>
            d.country && Number.isFinite(d.year) && Number.isFinite(d.percentage)
        );

        const selectedCountries = [
            "Australia", "South Africa", "United States", "India", 
            "United Kingdom", "Brazil", "Germany", "Costa Rica", 
            "Japan", "Turkey", "Canada", "Poland"
        ];

        const countryData = cleanData.filter(d =>
            selectedCountries.includes(d.country)
        );

        const minYear = d3.min(countryData, d => d.year);
        const maxYear = d3.max(countryData, d => d.year);

        const slider = d3.select("#lineYearSlider");
        const yearOutput = d3.select("#lineYearOutput");

        slider
            .attr("min", minYear)
            .attr("max", maxYear)
            .attr("value", maxYear);

        yearOutput.text(maxYear);

        const colour = d3.scaleOrdinal()
            .domain(selectedCountries)
            .range(d3.schemeTableau10);

        // Static Y Scale (Keeps same scale while scrolling)
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(countryData, d => d.percentage)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Y Axis & Gridlines
        const yAxis = svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale)
                .ticks(8)
                .tickSize(-(width - margin.left - margin.right))
                .tickFormat(d => `${d}%`)
            );

        yAxis.select(".domain").remove();
        
        yAxis.selectAll(".tick text")
            .attr("font-size", "11px")
            .attr("fill", "#444");
            
        yAxis.selectAll(".tick line")
            .attr("stroke", "#d9d9d9")
            .attr("stroke-width", 0.8)
            .attr("stroke-opacity", 0.5);

        // Y Axis Title
        svg.append("text")
            .attr("x", 5)
            .attr("y", 15)
            .attr("fill", "#333")
            .attr("font-size", "11px")
            .attr("font-weight", "500")
            .text("↑ Health expenditure (% of GDP)");
        
        svg.append("text")
            .attr("x", margin.left + (width - margin.left - margin.right) / 2)
            .attr("y", height - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#333")
            .attr("font-size", "14px")
            .attr("font-weight", "800")
            .text("(Years)");
            

        function updateChart(selectedYear) {
            const filteredData = countryData.filter(d => d.year <= selectedYear);

            const groupedData = d3.group(filteredData, d => d.country);

            // Sort chronologically
            groupedData.forEach((values, country) => {
                values.sort((a, b) => a.year - b.year);
            });

            // Convert Map into array
            const countries = Array.from(groupedData, ([country, values]) => ({
                country,
                values
            }));

            // X Scale
            const xScale = d3.scaleLinear()
                .domain([minYear, selectedYear])
                .range([margin.left, width - margin.right]);

            // Update X Axis
            xAxisGroup
                .transition()
                .duration(300)
                .call(d3.axisBottom(xScale)
                    .ticks(10)
                    .tickFormat(d3.format("d"))
                    .tickSizeOuter(0)
                );

            xAxisGroup.select(".domain")
                .attr("stroke", "#777")
                .attr("stroke-width", 0.8);

            xAxisGroup.selectAll(".tick line")
                .attr("stroke", "#aaa");

            xAxisGroup.selectAll(".tick text")
                .attr("font-size", "11px")
                .attr("fill", "#444");

            // Line Generator
            const line = d3.line()
                .defined(d => Number.isFinite(d.percentage))
                .x(d => xScale(d.year))
                .y(d => yScale(d.percentage));

            // Draw Country Lines
            lineGroup.selectAll(".country-line")
                .data(countries, d => d.country)
                .join(
                    enter => enter.append("path")
                        .attr("class", "country-line")
                        .attr("fill", "none")
                        .attr("stroke", d => colour(d.country))
                        .attr("stroke-width", 1.7)
                        .attr("stroke-opacity", 0.9)
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("d", d => line(d.values)),
                    update => update,
                    exit => exit.remove()
                )
                .transition()
                .duration(300)
                .attr("d", d => line(d.values));

            // Draw Country Labels
            labelGroup.selectAll(".country-label")
                .data(countries, d => d.country)
                .join(
                    enter => enter.append("text")
                        .attr("class", "country-label")
                        .attr("font-size", "11px")
                        .attr("font-weight", "500")
                        .attr("fill", d => colour(d.country))
                        .text(d => d.country),
                    update => update,
                    exit => exit.remove()
                )
                .transition()
                .duration(300)
                .attr("x", d => {
                    const lastPoint = d.values[d.values.length - 1];
                    return xScale(lastPoint.year) + 7;
                })
                .attr("y", d => {
                    const lastPoint = d.values[d.values.length - 1];
                    return yScale(lastPoint.percentage);
                })
                .attr("dy", "0.35em");
        }

        updateChart(maxYear);

        slider.on("input", (event) => {
            const selectedYear = +event.target.value;
            yearOutput.text(selectedYear);
            updateChart(selectedYear);
        });

    })
    .catch(error => {
        console.error("Error loading GDP line chart:", error);
    });

})();