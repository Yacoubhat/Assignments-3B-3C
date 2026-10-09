// javascripts/scatterPlot.js

(() => {
  
  const margin = { top: 40, right: 30, bottom: 60, left: 70 };
  const baseHeight = 500; 

  const container = d3.select(".scatter-Plot");
  container.selectAll("*").remove();

  
  const svg = container
    .append("svg")
    .style("width", "100%")
    .style("height", "auto")
    .style("display", "block");

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("z-index", 100); // Ensures it stays above the side panel

  // Persistent groups for axes and gridlines so they update cleanly instead of duplicating
  const xGridGroup = chart.append("g").attr("class", "grid x-grid");
  const yGridGroup = chart.append("g").attr("class", "grid y-grid");
  const xAxisGroup = chart.append("g").attr("class", "x-axis");
  const yAxisGroup = chart.append("g").attr("class", "y-axis");

  const xLabel = svg.append("text")
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Health Expenditure per Capita (USD)");

  const yLabel = svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Life Expectancy (Years)");

  const yearLabelText = chart.append("text")
    .attr("text-anchor", "end")
    .attr("font-size", "15px")
    .attr("font-weight", "bold")
    .attr("fill", "#555");

  d3.csv("data/health_data_merged.csv").then(data => {
    // Parse numeric values[cite: 3]
    data.forEach(d => {
      d.Expenditure = +d["Health Expenditure Share of ppp per capita"];
      d.LifeExpectancy = +d["Life Expectancy"];
      d.Year = +d.Year;
    });

    const filteredData = data.filter(d => d.Expenditure > 0 && d.LifeExpectancy > 0 && Number.isFinite(d.Year));
    const years = Array.from(new Set(filteredData.map(d => d.Year))).sort((a, b) => a - b);
    
    let currentYear = 2022; // Default year[cite: 3]

    const yearSelect = d3.select("#year-select");
    yearSelect.selectAll("option")
      .data(years)
      .join("option")
      .attr("value", d => d)
      .text(d => d);
      
    yearSelect.property("value", currentYear);

    // Set static domains based on the entire dataset[cite: 3]
    const x = d3.scaleLinear().domain([0, d3.max(filteredData, d => d.Expenditure) * 1.05]);
    const y = d3.scaleLinear().domain([d3.min(filteredData, d => d.LifeExpectancy) - 3, d3.max(filteredData, d => d.LifeExpectancy) + 2]);

    const countries = Array.from(new Set(filteredData.map(d => d.Country)));
    const colour = d3.scaleOrdinal().domain(countries).range(d3.schemeTableau10);

    // 2. The Dynamic Render Function
    function render() {
      // Actively measure the container's current pixel width
      const containerWidth = parseInt(container.style("width")) || 900;
      const width = containerWidth - margin.left - margin.right;
      const height = baseHeight - margin.top - margin.bottom;

      // Update the viewBox and dynamic ranges
      svg.attr("viewBox", `0 0 ${containerWidth} ${baseHeight}`);
      x.range([0, width]);
      y.range([height, 0]);

      // Redraw Axes & Gridlines with updated scaling
      xAxisGroup
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(Math.max(width / 80, 4)).tickFormat(d => `${d.toLocaleString()}`));

      yAxisGroup.call(d3.axisLeft(y).ticks(8));

      xGridGroup
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(""))
        .call(g => g.selectAll("line").attr("stroke", "#cfcfcf").attr("stroke-width", 0.8).attr("stroke-opacity", 0.6))
        .call(g => g.select(".domain").remove());

      yGridGroup
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .call(g => g.selectAll("line").attr("stroke", "#cfcfcf").attr("stroke-width", 0.8).attr("stroke-opacity", 0.6))
        .call(g => g.select(".domain").remove());

      // Update label positions
      xLabel
        .attr("x", margin.left + width / 2)
        .attr("y", baseHeight - 15);

      yLabel
        .attr("x", -(margin.top + height / 2))
        .attr("y", 20);

      yearLabelText
        .attr("x", width)
        .attr("y", -10)
        .text(`Year: ${currentYear}`);

      // Filter and join data
      const validData = filteredData.filter(d => d.Year === currentYear);

      // Plot circles
      chart.selectAll(".scatter-point")
        .data(validData, d => d.Country)
        .join(
            enter => enter.append("circle")
                .attr("class", "scatter-point")
                .attr("cx", d => x(d.Expenditure))
                .attr("cy", d => y(d.LifeExpectancy))
                .attr("r", 0)
                .attr("fill", d => colour(d.Country))
                .attr("opacity", 0.8)
                .call(enter => enter.transition().duration(500).attr("r", 6)),
            update => update
                .call(update => update.transition().duration(600)
                    .attr("cx", d => x(d.Expenditure))
                    .attr("cy", d => y(d.LifeExpectancy))
                ),
            exit => exit.call(exit => exit.transition().duration(300).attr("r", 0).remove())
        )
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(150).attr("r", 9);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`<strong>${d.Country} (${d.Year})</strong><br />Spend: $${Math.round(d.Expenditure).toLocaleString()}<br />Life Expectancy: ${d.LifeExpectancy} yrs`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).transition().duration(150).attr("r", 6);
            tooltip.transition().duration(300).style("opacity", 0);
        });

      // Prevent label overlapping
      const minLabelDistance = 28;
      const labelData = [];

      validData.forEach(d => {
        const px = x(d.Expenditure);
        const py = y(d.LifeExpectancy);
        const tooClose = labelData.some(l => Math.hypot(px - l.px, py - l.py) < minLabelDistance);
        if (!tooClose) labelData.push({...d, px, py});
      });

      // Plot country labels
      chart.selectAll(".country-label")
        .data(labelData, d => d.Country)
        .join(
            enter => enter.append("text")
                .attr("class", "country-label")
                .attr("x", d => d.px + 9)
                .attr("y", d => d.py)
                .attr("dy", "0.35em")
                .attr("font-size", "11px")
                .attr("fill", d => colour(d.Country))
                .attr("opacity", 0)
                .text(d => d.Country)
                .call(enter => enter.transition().duration(500).attr("opacity", 1)),
            update => update.call(update => update.transition().duration(600)
                .attr("x", d => d.px + 9)
                .attr("y", d => d.py)
            ),
            exit => exit.transition().duration(300).attr("opacity", 0).remove()
        );
    }

    // Dropdown change listener
    yearSelect.on("change", function() {
      currentYear = +this.value;
      render();
    });

    window.addEventListener("resize", () => {
        render();
    });

    render();
  });
})();