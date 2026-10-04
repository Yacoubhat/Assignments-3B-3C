// Visual 1: Healthcare Expenditure vs Life Expectancy
// D3 v7 is loaded in index.html. This file uses the global d3 object.

const chartRoot = d3.select("#health-spending-visual");
const chartArea = chartRoot.select(".scatter-chart");
const tooltip = chartRoot.select(".chart-tooltip");
const yearSlider = document.getElementById("yearSlider");
const yearOutput = document.getElementById("yearOutput");
const countrySelect = document.getElementById("countrySelect");
const playButton = document.getElementById("playButton");
const resetButton = document.getElementById("resetButton");
const storyText = document.getElementById("storyText");
const statCountries = document.getElementById("statCountries");
const statSpending = document.getElementById("statSpending");
const statLife = document.getElementById("statLife");

const margin = { top: 35, right: 35, bottom: 75, left: 90 };
let width = 900;
let height = 520;
let mergedData = [];
let years = [];
let selectedCountry = "All countries";
let currentYear = 2022;
let playTimer = null;

const svg = chartArea.append("svg")
  .attr("role", "img")
  .attr("aria-label", "Interactive scatter plot comparing healthcare expenditure per capita with life expectancy");

const plot = svg.append("g");
const xAxisG = plot.append("g").attr("class", "axis x-axis");
const yAxisG = plot.append("g").attr("class", "axis y-axis");
const gridXG = plot.append("g").attr("class", "grid grid-x");
const gridYG = plot.append("g").attr("class", "grid grid-y");
const trendG = plot.append("g").attr("class", "trend-layer");
const dotsG = plot.append("g").attr("class", "dots-layer");
const labelsG = plot.append("g").attr("class", "labels-layer");

const xLabel = svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle")
  .text("Healthcare expenditure per capita (PPP US$)");
const yLabel = svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle")
  .text("Life expectancy at birth (years)");

const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();

Promise.all([
  d3.csv("data/cleaned_health_expenditure_ppp.csv", d => ({
    code: d["Country Code"],
    country: d.Country,
    year: +d.Year,
    spending: +d["Health Expenditure Share of ppp per capita"]
  })),
  d3.csv("data/cleaned_life_expectancy_total.csv", d => ({
    country: d.Country,
    year: +d.Year,
    life: +d["Life Expectancy"]
  }))
]).then(([spending, life]) => {
  const lifeLookup = new Map(life.map(d => [`${d.country}|${d.year}`, d.life]));

  mergedData = spending
    .map(d => ({ ...d, life: lifeLookup.get(`${d.country}|${d.year}`) }))
    .filter(d => Number.isFinite(d.spending) && Number.isFinite(d.life));

  years = [...new Set(mergedData.map(d => d.year))].sort(d3.ascending);
  const countries = [...new Set(mergedData.map(d => d.country))].sort(d3.ascending);

  yearSlider.min = d3.min(years);
  yearSlider.max = d3.max(years);
  yearSlider.step = 1;
  currentYear = years.includes(2022) ? 2022 : d3.max(years);
  yearSlider.value = currentYear;
  yearOutput.textContent = currentYear;

  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });

  yearSlider.addEventListener("input", () => {
    currentYear = +yearSlider.value;
    yearOutput.textContent = currentYear;
    updateChart();
  });

  countrySelect.addEventListener("change", () => {
    selectedCountry = countrySelect.value;
    updateChart();
  });

  playButton.addEventListener("click", togglePlay);
  resetButton.addEventListener("click", resetVisual);
  window.addEventListener("resize", resizeChart);

  resizeChart();
}).catch(error => {
  console.error("Could not load visualisation data:", error);
  storyText.textContent = "The chart data could not be loaded. Check that the CSV files are inside the data folder.";
});

function resizeChart() {
  const containerWidth = Math.max(320, chartArea.node().getBoundingClientRect().width);
  width = containerWidth;
  height = Math.max(440, Math.min(590, containerWidth * 0.62));

  svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  plot.attr("transform", `translate(${margin.left},${margin.top})`);

  xScale.range([0, innerWidth]);
  yScale.range([innerHeight, 0]);

  xLabel.attr("x", margin.left + innerWidth / 2).attr("y", height - 15);
  yLabel.attr("transform", `translate(24,${margin.top + innerHeight / 2}) rotate(-90)`);

  updateChart(false);
}

function updateChart(animate = true) {
  if (!mergedData.length) return;

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const data = mergedData.filter(d => d.year === currentYear);
  if (!data.length) return;

  const maxSpending = d3.max(data, d => d.spending) || 1000;
  const lifeExtent = d3.extent(data, d => d.life);

  xScale.domain([0, maxSpending * 1.08]).nice();
  yScale.domain([Math.max(45, lifeExtent[0] - 3), Math.min(90, lifeExtent[1] + 3)]).nice();

  const transition = svg.transition().duration(animate ? 650 : 0).ease(d3.easeCubicOut);
  const xAxis = d3.axisBottom(xScale).ticks(width < 650 ? 5 : 8).tickFormat(d => d3.format("$~s")(d));
  const yAxis = d3.axisLeft(yScale).ticks(7);

  gridXG.attr("transform", `translate(0,${innerHeight})`)
    .transition(transition)
    .call(d3.axisBottom(xScale).ticks(width < 650 ? 5 : 8).tickSize(-innerHeight).tickFormat(""));
  gridYG.transition(transition)
    .call(d3.axisLeft(yScale).ticks(7).tickSize(-innerWidth).tickFormat(""));

  xAxisG.attr("transform", `translate(0,${innerHeight})`).transition(transition).call(xAxis);
  yAxisG.transition(transition).call(yAxis);

  drawTrendLine(data, transition);

  const dots = dotsG.selectAll("circle.country-dot").data(data, d => d.country);

  dots.exit().transition(transition).attr("r", 0).remove();

  const dotsEnter = dots.enter().append("circle")
    .attr("class", "country-dot")
    .attr("cx", d => xScale(d.spending))
    .attr("cy", d => yScale(d.life))
    .attr("r", 0)
    .on("mouseenter", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", (event, d) => {
      selectedCountry = d.country;
      countrySelect.value = d.country;
      updateChart();
    });

  dotsEnter.merge(dots)
    .classed("is-selected", d => selectedCountry !== "All countries" && d.country === selectedCountry)
    .classed("is-muted", d => selectedCountry !== "All countries" && d.country !== selectedCountry)
    .transition(transition)
    .attr("cx", d => xScale(d.spending))
    .attr("cy", d => yScale(d.life))
    .attr("r", d => selectedCountry === d.country ? 9 : 6);

  const selectedData = selectedCountry === "All countries" ? [] : data.filter(d => d.country === selectedCountry);
  const labels = labelsG.selectAll("text.country-label").data(selectedData, d => d.country);
  labels.exit().remove();
  labels.enter().append("text")
    .attr("class", "country-label")
    .merge(labels)
    .transition(transition)
    .attr("x", d => xScale(d.spending) + 12)
    .attr("y", d => yScale(d.life) - 10)
    .text(d => d.country);

  updateStory(data);
}

function drawTrendLine(data, transition) {
  if (data.length < 3) return;
  const meanX = d3.mean(data, d => d.spending);
  const meanY = d3.mean(data, d => d.life);
  const numerator = d3.sum(data, d => (d.spending - meanX) * (d.life - meanY));
  const denominator = d3.sum(data, d => Math.pow(d.spending - meanX, 2));
  const slope = denominator ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  const x1 = d3.min(data, d => d.spending);
  const x2 = d3.max(data, d => d.spending);
  const trendData = [{ x: x1, y: intercept + slope * x1 }, { x: x2, y: intercept + slope * x2 }];

  const line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y));
  trendG.selectAll("path.trend-line").data([trendData]).join("path")
    .attr("class", "trend-line")
    .transition(transition)
    .attr("d", line);
}

function updateStory(data) {
  const meanSpending = d3.mean(data, d => d.spending);
  const meanLife = d3.mean(data, d => d.life);
  statCountries.textContent = data.length;
  statSpending.textContent = d3.format("$,.0f")(meanSpending);
  statLife.textContent = `${d3.format(".1f")(meanLife)} yrs`;

  if (selectedCountry === "All countries") {
    storyText.innerHTML = `<strong>${currentYear}:</strong> ${data.length} countries have matched spending and life-expectancy data. Explore the overall pattern, then select or click a country to follow its position.`;
    return;
  }

  const d = data.find(row => row.country === selectedCountry);
  if (d) {
    const spendComparison = d.spending >= meanSpending ? "above" : "below";
    const lifeComparison = d.life >= meanLife ? "above" : "below";
    storyText.innerHTML = `<strong>${d.country} in ${currentYear}:</strong> healthcare expenditure was <strong>${d3.format("$,.0f")(d.spending)}</strong> per person (PPP) and life expectancy was <strong>${d.life.toFixed(1)} years</strong>. Both can be compared with the ${currentYear} averages: spending was ${spendComparison} average and life expectancy was ${lifeComparison} average.`;
  } else {
    storyText.innerHTML = `<strong>${selectedCountry}</strong> has no matched observation for ${currentYear}. Move the year slider to follow the country through years where both datasets are available.`;
  }
}

function showTooltip(event, d) {
  tooltip.classed("visible", true).html(`
    <strong>${d.country}</strong>
    <span>Year: ${d.year}</span>
    <span>Spending: ${d3.format("$,.0f")(d.spending)} PPP/person</span>
    <span>Life expectancy: ${d.life.toFixed(1)} years</span>
    <small>Click to highlight this country</small>
  `);
  moveTooltip(event);
}

function moveTooltip(event) {
  const bounds = chartRoot.node().getBoundingClientRect();
  tooltip.style("left", `${event.clientX - bounds.left + 14}px`).style("top", `${event.clientY - bounds.top - 15}px`);
}

function hideTooltip() {
  tooltip.classed("visible", false);
}

function togglePlay() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    playButton.textContent = "▶ Play years";
    return;
  }
  playButton.textContent = "❚❚ Pause";
  playTimer = setInterval(() => {
    const index = years.indexOf(currentYear);
    currentYear = years[(index + 1) % years.length];
    yearSlider.value = currentYear;
    yearOutput.textContent = currentYear;
    updateChart();
  }, 1200);
}

function resetVisual() {
  if (playTimer) togglePlay();
  selectedCountry = "All countries";
  countrySelect.value = "All countries";
  currentYear = years.includes(2022) ? 2022 : d3.max(years);
  yearSlider.value = currentYear;
  yearOutput.textContent = currentYear;
  updateChart();
}
