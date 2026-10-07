// javascripts/scatterPlot.js

(() => {
const margin = { top: 40, right: 180, bottom: 60, left: 70 };
const width = 950 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

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

  const filteredData = data.filter(d => d.Expenditure > 0 && d.LifeExpectancy > 0 && Number.isFinite(d.Year));

  const years = Array.from(new Set(filteredData.map(d => d.Year))).sort((a, b) => a - b);

  const yearSelect = d3.select("#year-select")
  yearSelect.selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const defaultYear = 2022;
  yearSelect.property("value", defaultYear)

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d.Expenditure) * 1.05])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(filteredData, d => d.LifeExpectancy) - 3, d3.max(filteredData, d => d.LifeExpectancy) + 2])
    .range([height, 0]);

  const countries = Array.from(new Set(filteredData.map(d => d.Country)));

  const colour = d3.scaleOrdinal()
    .domain(countries)
    .range(d3.schemeTableau10);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
        .ticks(8)
        .tickFormat(d => `${d.toLocaleString()}`)
    );

  svg.append("g")
    .call(d3.axisLeft(y).ticks(8));


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

// add subtle grid lines to the background of the chart
//x grid
  svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(""))
      .call(g => g.selectAll("line")
          .attr("stroke", "#cfcfcf")
          .attr("stroke-width", 0.8)
          .attr("stroke-opacity", 0.6))
      .call(g => g.select(".domain").remove());

  //y grid
  svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .call(g => g.selectAll("line")
          .attr("stroke", "#cfcfcf")
          .attr("stroke-width", 0.8)
          .attr("stroke-opacity", 0.6))
      .call(g => g.select(".domain").remove());

  // year label
  const yearLabel = svg.append("text")
    .attr("x", width)
    .attr("y", -10)
    .attr("text-anchor", "end")
    .attr("font-size", "15px")
    .attr("font-weight", "bold")
    .attr("fill", "#555")

  function updateChart(selectedYear){
  const validData = data.filter(d => d.Year === selectedYear);

  yearLabel.text(`Year: ${selectedYear}`);

  // Plot circles
  svg.selectAll(".scatter-point")
     .data(validData, d => d.Country)
     .join(
        enter => enter
            .append("circle")
            .attr("class", "scatter-point")
            .attr("cx", d => x(d.Expenditure))
            .attr("cy", d => y(d.LifeExpectancy))
            .attr("r", 0)
            .attr("fill", d => colour(d.Country))
            .attr("opacity", 0.8)
            .on("mouseover", function(event, d){
                d3.select(this)
                  .transition()
                  .duration(150)
                  .attr("r", 9);

                tooltip
                  .transition()
                  .duration(200)
                  .style("opacity", 0.9);
                
                tooltip
                  .html(`<strong> ${d.Country} (${d.Year}) </strong> <br /> Spend: $${Math.round(d.Expenditure).toLocaleString()} <br /> Life Expectancy: ${d.LifeExpectancy} yrs`)
                  .style("left", (event.pageX + 12) + "px")
                  .style("top", (event.pageY - 28) + "px");
                })
            .on("mouseout", function(){
                 d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("r", 6);

                tooltip
                    .transition()
                    .duration(300)
                    .style("opacity", 0);
            })
            .call(
              enter => enter
                      .transition()
                      .duration(500)
                      .attr("r", 6)
            ),
            update => update
              .call(update => update
                  .transition()
                  .duration(600)
                  .attr("cx", d => x(d.Expenditure))
                  .attr("cy", d => y(d.LifeExpectancy))
                  .attr("fill", d => colour(d.Country))
              ),
            exit => exit
              .call(exit => exit
                .transition()
                .duration(300)
                .attr("r", 0)
                .remove()
              )
         );

    const minLabelDistance = 28;
    const labelData = [];

    validData.forEach(d => {
      const px = x(d.Expenditure);
      const py = y(d.LifeExpectancy);

      const tooClose = labelData.some(l =>
        Math.hypot(px - l.px, py - l.py) < minLabelDistance
      );

      if (!tooClose) {
        labelData.push({...d, px, py});
      }
    });

    // Add country name beside each dot
    svg.selectAll(".country-label")
      .data(labelData, d => d.Country)
      .join(enter => enter
          .append("text")
          .attr("class", "country-label")
          .attr("x", d => x(d.Expenditure) + 9)
          .attr("y", d => y(d.LifeExpectancy)) 
          .attr("dy", "0.35em")
          .attr("font-size", "11px")
          .attr("fill", d => colour(d.Country))
          .attr("opacity", 0)
          .text(d => d.Country)
          .call( enter => enter 
              .transition()
              .duration(500)
              .attr("opacity", 1)
          ),
        update => update
          .text(d => d.Country)
          .call(update => update
              .transition()
              .duration(600)
              .attr("x", d => x(d.Expenditure) + 9)
              .attr("y", d => y(d.LifeExpectancy))
              .attr("fill", d => colour(d.Country))
          ),
        exit => exit
          .transition()
          .duration(300)
          .attr("opacity", 0)
          .remove()
      );

  }

  yearSelect.on("change", function(){

    const selectedYear = +this.value;

    updateChart(selectedYear);
  });

  updateChart(defaultYear)
    
    

});

})();


