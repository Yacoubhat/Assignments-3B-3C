(() => {
const width = 900;
const height = 600;

const margin = {
    top: 40,
    right: 150,
    bottom: 70,
    left: 80
};

const svg = d3.select(".connected-scatterPlot")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

// -----------------------------------------------------
// LOAD DATA
// -----------------------------------------------------

d3.csv("data/health_data_merged.csv").then(data => {

    // Convert strings from CSV into numbers
    data.forEach(d => {
        d.Year = +d.Year;
        d.expenditure = +d["Health Expenditure Share of ppp per capita"];
        d.lifeExpectancy = +d["Life Expectancy"];
    });

    // -------------------------------------------------
    // SELECT COUNTRIES
    // -------------------------------------------------

    const selectedCountryCode = [
        "USA", "CAN", "FRA", "JPN", "GBR",
        "CHN", "IND", "BRA", "TUR", "POL",
        "KOR", "DEU", "AUS", "ZAF", "FIN",
        "NOR", "SWE", "NLD", "NZL", "CHE"
    ];

    const filteredData = data.filter(d =>
        selectedCountryCode.includes(d["Country Code"])
    );

    // -------------------------------------------------
    // GROUP BY COUNTRY
    // -------------------------------------------------

    const groupedData = d3.group(filteredData, d => d.Country);

    // Sort each country's observations chronologically
    groupedData.forEach(values => {
        values.sort((a, b) => a.Year - b.Year);
    });

    // -------------------------------------------------
    // SCALES
    // -------------------------------------------------

    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.expenditure))
        .nice()
        .range([0, chartWidth]);

    const y = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.lifeExpectancy))
        .nice()
        .range([chartHeight, 0]);

    const colour = d3.scaleOrdinal()
        .domain(selectedCountryCode)
        .range(d3.schemeTableau10);

    // -------------------------------------------------
    // AXES & LABELS
    // -------------------------------------------------

    chart.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x));

    chart.append("g")
        .call(d3.axisLeft(y));

    // X AXIS LABEL
    svg.append("text")
        .attr("x", margin.left + chartWidth / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Health Expenditure (PPP per capita)");

    // Y AXIS LABEL
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(margin.top + chartHeight / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Life Expectancy (Years)");

    // -------------------------------------------------
    // LINE GENERATOR
    // -------------------------------------------------

    const line = d3.line()
        .x(d => x(d.expenditure))
        .y(d => y(d.lifeExpectancy));

    // -------------------------------------------------
    // DRAW ONE TRAJECTORY PER COUNTRY
    // -------------------------------------------------

    groupedData.forEach((countryData, country) => {
        chart.append("path")
            .datum(countryData)
            .attr("class", "country-line")
            .attr("fill", "none") // Prevents the black SVG blob
            .attr("stroke", colour(country))
            .attr("stroke-width", 2)
            .attr("d", line);
    });

    // -------------------------------------------------
    // DRAW YEARLY OBSERVATIONS & TOOLTIPS
    // -------------------------------------------------

    chart.selectAll(".point")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d.expenditure))
        .attr("cy", d => y(d.lifeExpectancy))
        .attr("r", 4)
        .attr("fill", d => colour(d.Country))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 2.5);
            
            tooltip
                .style("opacity", 0.55)
                .html(`
                    <strong>${d.Country}</strong><br>
                    Year: ${d.Year}<br>
                    Expenditure: $${d.expenditure.toFixed(2)}<br>
                    Life expectancy: ${d.lifeExpectancy.toFixed(1)}
                `);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 4);
            tooltip.style("opacity", 0);
        });

    // -------------------------------------------------
    // LABEL EACH COUNTRY AT ITS MOST RECENT POINT
    // -------------------------------------------------

    groupedData.forEach((countryData, country) => {
        const lastPoint = countryData[countryData.length - 1];
        
        chart.append("text")
            .attr("x", x(lastPoint.expenditure) + 7)
            .attr("y", y(lastPoint.lifeExpectancy))
            .attr("dy", "0.35em") // Centers the text vertically with the dot
            .attr("fill", colour(country))
            .attr("font-size", 12)
            .text(country);
    });
});

})();