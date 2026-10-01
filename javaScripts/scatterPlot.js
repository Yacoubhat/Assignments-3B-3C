// javaScripts/scatterPlot.js
const margin = { top: 50, right: 40, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Select container and create SVG
const svg = d3.select("#visualisation-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip setup
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(20, 20, 20, 0.9)")
  .style("color", "#fff")
  .style("padding", "8px 12px")
  .style("border-radius", "5px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("box-shadow", "0 2px 6px rgba(0,0,0,0.3)");

// Load the merged OECD dataset
d3.csv("data/health_data_merged.csv").then(data => {
  // Parse numeric fields according to exact CSV column headers
  data.forEach(d => {
    d.Expenditure = +d["Health Expenditure Share of ppp per capita"];
    d.LifeExpectancy = +d["Life Expectancy"];
    d.Year = +d.Year;
  });

  // Filter for 2019 where OECD country reporting is most complete
  const filteredData = data.filter(d => d.Year === 2019 && d.Expenditure > 0 && d.LifeExpectancy > 0);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d.Expenditure) * 1.1])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(filteredData, d => d.LifeExpectancy) - 3,
      d3.max(filteredData, d => d.LifeExpectancy) + 2
    ])
    .range([height, 0]);

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d => `$${d.toLocaleString()}`))
    .style("font-size", "11px");

  // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y).ticks(8))
    .style("font-size", "11px");

  // X Axis Label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .text("Health Expenditure per Capita (USD PPP, 2019)");

  // Y Axis Label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .text("Life Expectancy (Years)");

  // Data Points (Circles)
  svg.selectAll("circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.Expenditure))
    .attr("cy", d => y(d.LifeExpectancy))
    .attr("r", 6)
    .attr("fill", "#2b6cb0")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.85)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition().duration(150)
        .attr("r", 9)
        .attr("fill", "#e53e3e");

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <strong>${d.Country} (${d.Year})</strong><br/>
        Expenditure: $${Math.round(d.Expenditure).toLocaleString()}<br/>
        Life Expectancy: ${d.LifeExpectancy} years
      `)
      .style("left", (event.pageX + 12) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition().duration(200)
        .attr("r", 6)
        .attr("fill", "#2b6cb0");

      tooltip.transition().duration(300).style("opacity", 0);
    });
}).catch(err => {
  console.error("Error loading CSV:", err);
});