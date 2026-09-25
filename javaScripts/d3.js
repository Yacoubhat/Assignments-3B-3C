import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = {top: 20, right: 30, bottom: 40, left: 90};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;


const svg = d3.select(".chartContainer")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear()
    .range([0, width])
    .domain([500, 16000]);
    
const yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 90]);

const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format("$.0s"));
const yAxis = d3.axisLeft(yScale);


svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .style("fill", "white")
    .style("font-size", "26px")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Healthcare Expenditure per Capita (USD)");

svg.append("g")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .style("fill", "white")
    .style("font-size", "26px")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Life Expectancy (Years)");
