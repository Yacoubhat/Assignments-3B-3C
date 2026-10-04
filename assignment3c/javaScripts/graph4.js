// Visual 4: Female–male life expectancy gap by country.
(function () {
  const root = d3.select("#gender-gap-visual");
  const chart = root.select(".gap-bar-chart");
  const tooltip = root.select(".gap-tooltip");
  const yearSlider = document.getElementById("gapYearSlider");
  const yearOutput = document.getElementById("gapYearOutput");
  const countSelect = document.getElementById("gapCountSelect");
  const story = document.getElementById("gapStoryText");
  let data = [];

  Promise.all([
    d3.csv("data/cleaned_life_expectancy_female.csv", parseRow),
    d3.csv("data/cleaned_life_expectancy_male.csv", parseRow)
  ]).then(([female, male]) => {
    const maleLookup = new Map(male.map(d => [`${d.country}|${d.year}`, d.life]));
    data = female.map(d => ({ ...d, male: maleLookup.get(`${d.country}|${d.year}`) }))
      .filter(d => Number.isFinite(d.male)).map(d => ({ ...d, gap: d.life - d.male }));
    const years = [...new Set(data.map(d => d.year))].sort(d3.ascending);
    yearSlider.min = d3.min(years); yearSlider.max = d3.max(years);
    yearSlider.value = years.includes(2022) ? 2022 : d3.max(years); yearOutput.textContent = yearSlider.value;
    yearSlider.addEventListener("input", () => { yearOutput.textContent = yearSlider.value; draw(); });
    countSelect.addEventListener("change", draw);
    window.addEventListener("resize", draw);
    draw();
  }).catch(showError);

  function parseRow(d) { return { country: d.Country, year: +d.Year, life: +d["Life Expectancy"] }; }

  function draw() {
    const year = +yearSlider.value;
    const all = data.filter(d => d.year === year).sort((a, b) => d3.descending(a.gap, b.gap));
    const shown = all.slice(0, +countSelect.value);
    const width = Math.max(320, chart.node().getBoundingClientRect().width);
    const margin = { top: 28, right: 72, bottom: 55, left: width < 560 ? 92 : 150 };
    const rowHeight = width < 560 ? 30 : 34;
    const height = margin.top + margin.bottom + shown.length * rowHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = shown.length * rowHeight;
    chart.selectAll("*").remove();
    const svg = chart.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height)
      .attr("role", "img").attr("aria-label", `Life expectancy gender gap ranking in ${year}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(shown, d => d.gap) * 1.08]).nice().range([0, innerWidth]);
    const y = d3.scaleBand().domain(shown.map(d => d.country)).range([0, innerHeight]).padding(.22);
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6).tickSize(-innerHeight).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(6));
    g.append("g").attr("class", "axis bar-country").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.selectAll(".rank-bar").data(shown).join("rect").attr("class", "rank-bar")
      .attr("x", 0).attr("y", d => y(d.country)).attr("height", y.bandwidth()).attr("width", d => x(d.gap))
      .attr("rx", 5).attr("fill", (d, i) => d3.interpolateRgb("#8c7cff", "#ff7fc8")(1 - i / Math.max(1, shown.length - 1)))
      .on("mouseenter", (event, d) => showTooltip(event, d)).on("mousemove", moveTooltip).on("mouseleave", () => tooltip.classed("visible", false));
    g.selectAll(".bar-value").data(shown).join("text").attr("class", "bar-value")
      .attr("x", d => x(d.gap) + 7).attr("y", d => y(d.country) + y.bandwidth() / 2 + 4).text(d => `${d.gap.toFixed(1)} yrs`);
    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("x", margin.left + innerWidth / 2).attr("y", height - 10).text("Female life expectancy minus male life expectancy (years)");

    const average = d3.mean(all, d => d.gap);
    document.getElementById("gapLargest").textContent = all.length ? `${all[0].gap.toFixed(1)} yrs` : "–";
    document.getElementById("gapAverage").textContent = Number.isFinite(average) ? `${average.toFixed(1)} yrs` : "–";
    document.getElementById("gapCountries").textContent = all.length;
    story.textContent = all.length ? `${all[0].country} had the largest female–male life expectancy gap in ${year}, at ${all[0].gap.toFixed(1)} years.` : `No paired records are available for ${year}.`;
  }

  function showTooltip(event, d) {
    tooltip.html(`<strong>${d.country}</strong><span>Female: ${d.life.toFixed(1)} years</span><span>Male: ${d.male.toFixed(1)} years</span><small>Gap: ${d.gap.toFixed(1)} years · ${d.year}</small>`).classed("visible", true);
    moveTooltip(event);
  }
  function moveTooltip(event) {
    const box = root.select(".chart-shell").node().getBoundingClientRect();
    tooltip.style("left", `${Math.min(event.clientX - box.left + 12, box.width - 220)}px`).style("top", `${event.clientY - box.top - 92}px`);
  }
  function showError(error) {
    console.error("Could not load Visual 4:", error);
    chart.html('<p class="chart-error">The life-expectancy files could not be loaded.</p>');
    story.textContent = "Check that both cleaned life-expectancy CSV files are in the data folder.";
  }
})();
