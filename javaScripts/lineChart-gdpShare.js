(() => {

    const width = 950;
    const height = 500;

    const margin = {top: 35, right: 150, bottom: 45, left: 55 };
   

    //svg
    const svg = d3.select(".lineChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("max-width", "100%")
        .style("height", "auto")

    
    
    //load data
    d3.csv("data/cleaned-health-expenditure-share-gdp.csv").then(data => {
        data.forEach(d =>{
            d.year = +d.Year;
            d.Country = d.Country;
            d.percentage = +d["Public health expenditure as a share of GDP"]
        });

    const cleanData = data.filter(d => 
        d.Country && Number.isFinite(d.year) && Number.isFinite(d.percentage)
    );

    const selectedCountries = [
            "Australia", "South Africa", "Costa Rica",
            "United States", "India", "Norway",
            "United Kingdom", "Brazil", "France",
            "Germany", "Costa Rica", "Sweden",
            "Japan", "Turkey", "South Korea",
            "Canada", "Poland", "China",
        ];

    const labelledCountries = [
        "Australia",
        "United States",
        "United Kingdom",
        "Japan",
        "South Africa",
        "Poland",
        "Turkey",
        "India"
    ];

    const filteredData = cleanData.filter(d => selectedCountries.includes(d.Country));

    // group data by country

    const groupedData = d3.group(filteredData, d => d.Country);

    // sort each country chronologically
    groupedData.forEach(values =>{
        values.sort((a, b) => a.year - b.year);
    });

    //scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.year))
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.percentage)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    //colour scales

    const countries = Array.from(groupedData.keys());

    const colour = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.schemeTableau10);

    //x-axis
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d")).tickSizeOuter(0));

    //subtle axis
     xAxis.select(".domain")
                .attr("stroke", "#777")
                .attr("stroke-width", 0.8);


    xAxis.selectAll(".tick line")
        .attr("stroke", "#aaa");


    xAxis.selectAll(".tick text")
        .attr("font-size", "11px")
        .attr("fill", "#444");

    // Y-axis
    const yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => d + "%").tickSize(0));

    // Remove vertical y-axis line
    yAxis.select(".domain")
        .remove();


    yAxis.selectAll(".tick text")
        .attr("font-size", "11px")
        .attr("fill", "#444");

    //horizontal gridlines
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(8).tickSize(-(width - margin.left - margin.right)).tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
            .attr("stroke", "#d9d9d9")
            .attr("stroke-width", 0.8)
            .attr("stroke-opacity", 0.7)
        );

    //line generator
    const line = d3.line()
        .defined(d => Number.isFinite(d.percentage))
        .x(d => xScale(d.Year))
        .y(d => yScale(d.percentage));

    //draw country lines
    groupedData.forEach((values, country) => {

        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", colour(country))
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.9)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line);

        });

    //y axis title
    svg.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("fill", "#333")
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .text("↑ Health expenditure (% of GDP)");

    //country labels at the end of lines
    groupedData.forEach((values, country) => {

        // only label selected important countries
        if (!labelledCountries.includes(country)) return;
        const lastPoint = values[values.length - 1];

        svg.append("text")
            .attr("x", xScale(lastPoint.year) + 7)
            .attr("y", yScale(lastPoint.percentage))
            .attr("dy", "0.35em")
            .attr("font-size", "11px")
            .attr("font-weight", "500")
            .attr("fill", colour(country))
            .text(country);
        });

    });

})();