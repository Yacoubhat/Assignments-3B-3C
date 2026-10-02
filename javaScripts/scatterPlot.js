// javascripts/scatterPlot.js
const margin = { top: 40, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select(".scatter-Plot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.8)")
  .style("color", "#fff")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("pointer-events", "none");

d3.csv("data/health_data_merged.csv").then(data => {
  // Parse numeric values
  data.forEach(d => {
    d.Expenditure = +d["Health Expenditure Share of ppp per capita"];
    d.LifeExpectancy = +d["Life Expectancy"];
    d.Year = +d.Year;
  });

  // Filter for valid values and pick the latest common year (e.g. 2021)
  const availableYears = [...new Set(data.map(d => d.Year))].sort((a, b) => b - a);
  const selectedYear = availableYears[0];
  const filteredData = data.filter(d => d.Year === selectedYear && d.Expenditure > 0 && d.LifeExpectancy > 0);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Expenditure) * 1.05])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.LifeExpectancy) - 3, d3.max(data, d => d.LifeExpectancy) + 2])
    .range([height, 0]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Health Expenditure per Capita (USD)");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Life Expectancy (Years)");

  // Plot circles
  svg.selectAll("circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.Expenditure))
    .attr("cy", d => y(d.LifeExpectancy))
    .attr("r", 6)
    .attr("fill", "#2b6cb0")
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`<strong>${d.Country} (${d.Year})</strong><br/>Spend: $${Math.round(d.Expenditure).toLocaleString()}<br/>Life Expectancy: ${d.LifeExpectancy} yrs`)
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });
});