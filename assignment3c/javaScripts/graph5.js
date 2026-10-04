// Visual 5: Public health expenditure as a share of GDP.
(function () {
  const root = d3.select("#gdp-spending-visual");
  const chart = root.select(".gdp-bar-chart");
  const tooltip = root.select(".gdp-tooltip");
  const yearSlider = document.getElementById("gdpYearSlider");
  const yearOutput = document.getElementById("gdpYearOutput");
  const countSelect = document.getElementById("gdpCountSelect");
  const story = document.getElementById("gdpStoryText");
  let data = [];

  d3.csv("data/public-health-expenditure-share-gdp.csv", d => ({
    country: d.Entity, code: d.Code, year: +d.Year,
    share: +d["Public health expenditure as a share of GDP"]
  })).then(rows => {
    data = rows.filter(d => d.code && Number.isFinite(d.share));
    const years = [...new Set(data.map(d => d.year))].sort(d3.ascending);
    yearSlider.min = d3.min(years); yearSlider.max = d3.max(years);
    yearSlider.value = years.includes(2022) ? 2022 : d3.max(years); yearOutput.textContent = yearSlider.value;
    yearSlider.addEventListener("input", () => { yearOutput.textContent = yearSlider.value; draw(); });
    countSelect.addEventListener("change", draw);
    window.addEventListener("resize", draw);
    draw();
  }).catch(showError);

  function draw() {
    const year = +yearSlider.value;
    const all = data.filter(d => d.year === year).sort((a, b) => d3.descending(a.share, b.share));
    const shown = all.slice(0, +countSelect.value);
    const width = Math.max(320, chart.node().getBoundingClientRect().width);
    const margin = { top: 28, right: 65, bottom: 55, left: width < 560 ? 92 : 150 };
    const rowHeight = width < 560 ? 30 : 34;
    const height = margin.top + margin.bottom + shown.length * rowHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = shown.length * rowHeight;
    chart.selectAll("*").remove();
    const svg = chart.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height)
      .attr("role", "img").attr("aria-label", `Public health expenditure share of GDP ranking in ${year}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(shown, d => d.share) * 1.08]).nice().range([0, innerWidth]);
    const y = d3.scaleBand().domain(shown.map(d => d.country)).range([0, innerHeight]).padding(.22);
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6).tickSize(-innerHeight).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d}%`));
    g.append("g").attr("class", "axis bar-country").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.selectAll(".rank-bar").data(shown).join("rect").attr("class", "rank-bar")
      .attr("x", 0).attr("y", d => y(d.country)).attr("height", y.bandwidth()).attr("width", d => x(d.share))
      .attr("rx", 5).attr("fill", (d, i) => d3.interpolateRgb("#735df5", "#04c983")(1 - i / Math.max(1, shown.length - 1)))
      .on("mouseenter", (event, d) => showTooltip(event, d)).on("mousemove", moveTooltip).on("mouseleave", () => tooltip.classed("visible", false));
    g.selectAll(".bar-value").data(shown).join("text").attr("class", "bar-value")
      .attr("x", d => x(d.share) + 7).attr("y", d => y(d.country) + y.bandwidth() / 2 + 4).text(d => `${d.share.toFixed(1)}%`);
    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("x", margin.left + innerWidth / 2).attr("y", height - 10).text("Public health expenditure as a share of GDP");

    const average = d3.mean(all, d => d.share);
    document.getElementById("gdpHighest").textContent = all.length ? `${all[0].share.toFixed(1)}%` : "–";
    document.getElementById("gdpAverage").textContent = Number.isFinite(average) ? `${average.toFixed(1)}%` : "–";
    document.getElementById("gdpCountries").textContent = all.length;
    story.textContent = all.length ? `${all[0].country} recorded the highest public health expenditure share in ${year}, at ${all[0].share.toFixed(1)}% of GDP.` : `No country records are available for ${year}.`;
  }

  function showTooltip(event, d) {
    tooltip.html(`<strong>${d.country}</strong><span>${d.share.toFixed(2)}% of GDP</span><small>${d.year}</small>`).classed("visible", true);
    moveTooltip(event);
  }
  function moveTooltip(event) {
    const box = root.select(".chart-shell").node().getBoundingClientRect();
    tooltip.style("left", `${Math.min(event.clientX - box.left + 12, box.width - 210)}px`).style("top", `${event.clientY - box.top - 72}px`);
  }
  function showError(error) {
    console.error("Could not load Visual 5:", error);
    chart.html('<p class="chart-error">The public-health-expenditure file could not be loaded.</p>');
    story.textContent = "Check that public-health-expenditure-share-gdp.csv is in the data folder.";
  }
})();
