// Visual 3: Female and male life expectancy over time.
(function () {
  const root = d3.select("#gender-trend-visual");
  const chart = root.select(".gender-line-chart");
  const tooltip = root.select(".gender-tooltip");
  const countrySelect = document.getElementById("genderCountrySelect");
  const story = document.getElementById("genderStoryText");
  const femaleStat = document.getElementById("genderFemaleLatest");
  const maleStat = document.getElementById("genderMaleLatest");
  const gapStat = document.getElementById("genderLatestGap");
  const colours = { Female: "#ff7fc8", Male: "#75d6ff" };
  let rows = [];

  Promise.all([
    d3.csv("data/cleaned_life_expectancy_female.csv", parseRow),
    d3.csv("data/cleaned_life_expectancy_male.csv", parseRow)
  ]).then(([female, male]) => {
    rows = female.concat(male).filter(d => Number.isFinite(d.life));
    const femaleCountries = new Set(female.map(d => d.country));
    const countries = [...new Set(male.map(d => d.country).filter(c => femaleCountries.has(c)))].sort(d3.ascending);
    countries.forEach(country => countrySelect.add(new Option(country, country)));
    countrySelect.value = countries.includes("Australia") ? "Australia" : countries[0];
    countrySelect.addEventListener("change", draw);
    window.addEventListener("resize", draw);
    draw();
  }).catch(showError);

  function parseRow(d) {
    return { country: d.Country, sex: d.Sex, year: +d.Year, life: +d["Life Expectancy"] };
  }

  function draw() {
    const country = countrySelect.value;
    const data = rows.filter(d => d.country === country).sort((a, b) => d3.ascending(a.year, b.year));
    const series = d3.groups(data, d => d.sex).map(([sex, values]) => ({ sex, values }));
    const width = Math.max(320, chart.node().getBoundingClientRect().width);
    const height = Math.max(430, Math.min(570, width * .58));
    const margin = { top: 35, right: 35, bottom: 65, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    chart.selectAll("*").remove();

    const svg = chart.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height)
      .attr("role", "img").attr("aria-label", `Female and male life expectancy in ${country}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, innerWidth]);
    const extent = d3.extent(data, d => d.life);
    const y = d3.scaleLinear().domain([Math.floor(extent[0] - 1), Math.ceil(extent[1] + 1)]).nice().range([innerHeight, 0]);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(Math.min(10, data.length / 2)).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y));
    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("x", margin.left + innerWidth / 2).attr("y", height - 14).text("Year");
    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("transform", `translate(20,${margin.top + innerHeight / 2}) rotate(-90)`).text("Life expectancy (years)");

    const line = d3.line().x(d => x(d.year)).y(d => y(d.life));
    g.selectAll(".gender-line").data(series).join("path").attr("class", "gender-line")
      .attr("stroke", d => colours[d.sex]).attr("d", d => line(d.values));
    g.selectAll(".gender-point").data(data).join("circle").attr("class", "gender-point")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.life)).attr("r", 4).attr("fill", d => colours[d.sex])
      .on("mouseenter", (event, d) => showTooltip(event, d)).on("mousemove", moveTooltip).on("mouseleave", hideTooltip);

    const latestYear = d3.max(data, d => d.year);
    const latest = data.filter(d => d.year === latestYear);
    const female = latest.find(d => d.sex === "Female");
    const male = latest.find(d => d.sex === "Male");
    const gap = female && male ? female.life - male.life : NaN;
    femaleStat.textContent = female ? `${female.life.toFixed(1)} yrs` : "–";
    maleStat.textContent = male ? `${male.life.toFixed(1)} yrs` : "–";
    gapStat.textContent = Number.isFinite(gap) ? `${gap.toFixed(1)} yrs` : "–";
    story.textContent = Number.isFinite(gap)
      ? `In ${country}, female life expectancy was ${gap.toFixed(1)} years higher than male life expectancy in ${latestYear}. Hover over a point for its exact value.`
      : `Life-expectancy records for ${country} are shown over time.`;
  }

  function showTooltip(event, d) {
    tooltip.html(`<strong>${d.country}</strong><span>${d.sex}: ${d.life.toFixed(1)} years</span><small>${d.year}</small>`).classed("visible", true);
    moveTooltip(event);
  }
  function moveTooltip(event) {
    const box = root.select(".chart-shell").node().getBoundingClientRect();
    tooltip.style("left", `${Math.min(event.clientX - box.left + 12, box.width - 210)}px`).style("top", `${event.clientY - box.top - 75}px`);
  }
  function hideTooltip() { tooltip.classed("visible", false); }
  function showError(error) {
    console.error("Could not load Visual 3:", error);
    chart.html('<p class="chart-error">The male and female life-expectancy files could not be loaded.</p>');
    story.textContent = "Check that both cleaned life-expectancy CSV files are in the data folder.";
  }
})();
