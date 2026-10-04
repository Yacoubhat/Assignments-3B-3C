// Visual 2: Healthcare expenditure over time
// Kept in its own file so each major visualisation is easier to maintain and explain.
(function () {
  const root = d3.select("#spending-trend-visual");
  if (root.empty()) return;

  const chartArea = root.select(".line-chart");
  const tooltip = root.select(".trend2-tooltip");
  const countrySelect = document.getElementById("trendCountrySelect");
  const addButton = document.getElementById("trendAddCountry");
  const startSelect = document.getElementById("trendStartYear");
  const endSelect = document.getElementById("trendEndYear");
  const chips = document.getElementById("trendSelectedCountries");
  const story = document.getElementById("trendStoryText");
  const statCountries = document.getElementById("trendStatCountries");
  const statHighest = document.getElementById("trendStatHighest");
  const statGrowth = document.getElementById("trendStatGrowth");

  const colours = ["#75d6ff", "#b9ff7b", "#ffb45e", "#ff7eb6", "#a99cff"];
  const defaultCountries = ["Australia", "Japan", "United States", "Germany"];
  let allData = [];
  let countries = [];
  let years = [];
  let selected = [];
  let focusedCountry = null;

  const money = d3.format("$,.0f");
  const pct = d3.format("+.0f");

  d3.csv("data/cleaned_health_expenditure_ppp.csv", d => ({
    code: d["Country Code"],
    country: d.Country,
    year: +d.Year,
    spending: +d["Health Expenditure Share of ppp per capita"]
  })).then(data => {
    allData = data.filter(d => Number.isFinite(d.year) && Number.isFinite(d.spending));
    countries = Array.from(new Set(allData.map(d => d.country))).sort(d3.ascending);
    years = Array.from(new Set(allData.map(d => d.year))).sort(d3.ascending);
    selected = defaultCountries.filter(c => countries.includes(c));

    countrySelect.innerHTML = countries.map(c => `<option value="${c}">${c}</option>`).join("");
    const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join("");
    startSelect.innerHTML = yearOptions;
    endSelect.innerHTML = yearOptions;
    startSelect.value = years[0];
    endSelect.value = years[years.length - 1];
    countrySelect.value = countries.includes("United Kingdom") ? "United Kingdom" : countries[0];

    addButton.addEventListener("click", addCountry);
    startSelect.addEventListener("change", validateRangeAndRender);
    endSelect.addEventListener("change", validateRangeAndRender);
    window.addEventListener("resize", debounce(render, 140));
    render();
  }).catch(error => {
    console.error("Visual 2 data loading error:", error);
    story.textContent = "The healthcare expenditure dataset could not be loaded. Check the data folder and CSV filename.";
  });

  function addCountry() {
    const c = countrySelect.value;
    if (selected.includes(c)) return;
    if (selected.length >= 5) {
      story.innerHTML = "You can compare up to <strong>five countries</strong> at once. Remove one of the selected countries before adding another.";
      return;
    }
    selected.push(c);
    focusedCountry = null;
    render();
  }

  function removeCountry(country) {
    selected = selected.filter(c => c !== country);
    if (focusedCountry === country) focusedCountry = null;
    render();
  }

  function validateRangeAndRender() {
    let start = +startSelect.value;
    let end = +endSelect.value;
    if (start > end) {
      if (document.activeElement === startSelect) endSelect.value = start;
      else startSelect.value = end;
    }
    render();
  }

  function renderChips() {
    chips.innerHTML = "";
    if (!selected.length) {
      chips.innerHTML = '<span class="trend2-empty">No countries selected. Add a country above to begin comparing.</span>';
      return;
    }
    selected.forEach((country, i) => {
      const chip = document.createElement("span");
      chip.className = "country-chip";
      chip.style.setProperty("--chip-color", colours[i]);
      chip.innerHTML = `<i></i><span>${country}</span><button type="button" aria-label="Remove ${country}">×</button>`;
      chip.querySelector("button").addEventListener("click", () => removeCountry(country));
      chips.appendChild(chip);
    });
  }

  function render() {
    if (!allData.length) return;
    renderChips();
    chartArea.selectAll("*").remove();
    tooltip.classed("visible", false);

    const startYear = +startSelect.value;
    const endYear = +endSelect.value;
    const visible = allData.filter(d => selected.includes(d.country) && d.year >= startYear && d.year <= endYear);
    updateStory(visible, startYear, endYear);

    const containerWidth = Math.max(320, chartArea.node().getBoundingClientRect().width || 900);
    const outerWidth = containerWidth;
    const outerHeight = Math.max(440, Math.min(590, containerWidth * 0.58));
    const margin = { top: 35, right: 35, bottom: 70, left: 92 };
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;

    const svg = chartArea.append("svg")
      .attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`)
      .attr("role", "img")
      .attr("aria-label", "Line chart comparing healthcare expenditure per capita over time");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([startYear, endYear]).range([0, width]);
    const yMax = d3.max(visible, d => d.spending) || 1000;
    const y = d3.scaleLinear().domain([0, yMax * 1.08]).nice().range([height, 0]);

    g.append("g").attr("class", "grid")
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""));
    g.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.min(10, Math.max(2, endYear - startYear))).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => money(d)));

    svg.append("text").attr("class", "axis-label")
      .attr("x", margin.left + width / 2).attr("y", outerHeight - 18)
      .attr("text-anchor", "middle").text("Year");
    svg.append("text").attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + height / 2)).attr("y", 24)
      .attr("text-anchor", "middle").text("Healthcare expenditure per capita (PPP)");

    if (!selected.length || !visible.length) return;

    const grouped = d3.group(visible, d => d.country);
    const line = d3.line().x(d => x(d.year)).y(d => y(d.spending)).curve(d3.curveMonotoneX);

    selected.forEach((country, i) => {
      const series = (grouped.get(country) || []).slice().sort((a,b) => d3.ascending(a.year,b.year));
      if (!series.length) return;
      const muted = focusedCountry && focusedCountry !== country;
      g.append("path").datum(series).attr("class", `spending-line${muted ? " is-muted" : ""}`)
        .attr("stroke", colours[i]).attr("d", line);
      g.append("path").datum(series).attr("class", "spending-line-hit").attr("d", line)
        .on("click", () => { focusedCountry = focusedCountry === country ? null : country; render(); });
    });

    const guide = g.append("line").attr("class", "hover-guide").attr("y1", 0).attr("y2", height).style("display", "none");
    const hoverLayer = g.append("g").style("pointer-events", "none");
    const bisectYear = d3.bisector(d => d.year).center;

    g.append("rect").attr("width", width).attr("height", height).attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event, this);
        const hoverYear = Math.max(startYear, Math.min(endYear, Math.round(x.invert(mx))));
        guide.attr("x1", x(hoverYear)).attr("x2", x(hoverYear)).style("display", null);
        hoverLayer.selectAll("*").remove();
        const rows = [];
        selected.forEach((country, i) => {
          const series = (grouped.get(country) || []).slice().sort((a,b) => d3.ascending(a.year,b.year));
          if (!series.length) return;
          const idx = bisectYear(series, hoverYear);
          const d = series[idx];
          if (!d || d.year !== hoverYear) return;
          rows.push({ ...d, colour: colours[i] });
          hoverLayer.append("circle").attr("class", "hover-point").attr("cx", x(d.year)).attr("cy", y(d.spending)).attr("r", 5.5).attr("fill", colours[i]);
        });
        rows.sort((a,b) => d3.descending(a.spending,b.spending));
        if (!rows.length) return;
        tooltip.html(`<strong>${hoverYear}</strong>` + rows.map(r => `<span><b style="color:${r.colour}">●</b> ${r.country}: ${money(r.spending)}</span>`).join(""))
          .classed("visible", true)
          .style("left", `${Math.min(outerWidth - 235, margin.left + x(hoverYear) + 14)}px`)
          .style("top", `${margin.top + 12}px`);
      })
      .on("mouseleave", () => { guide.style("display", "none"); hoverLayer.selectAll("*").remove(); tooltip.classed("visible", false); });
  }

  function updateStory(visible, startYear, endYear) {
    statCountries.textContent = selected.length;
    if (!selected.length) {
      statHighest.textContent = "–"; statGrowth.textContent = "–";
      story.textContent = "Add countries to compare how healthcare spending changed over time.";
      return;
    }

    const byCountry = d3.group(visible, d => d.country);
    const summaries = selected.map(country => {
      const s = (byCountry.get(country) || []).slice().sort((a,b) => d3.ascending(a.year,b.year));
      if (!s.length) return null;
      const first = s[0], last = s[s.length - 1];
      return { country, first, last, growth: first.spending ? ((last.spending / first.spending) - 1) * 100 : 0 };
    }).filter(Boolean);

    const latestHighest = d3.greatest(summaries, d => d.last.spending);
    const growthHighest = d3.greatest(summaries, d => d.growth);
    statHighest.textContent = latestHighest ? money(latestHighest.last.spending) : "–";
    statGrowth.textContent = growthHighest ? `${pct(growthHighest.growth)}%` : "–";

    if (!summaries.length) {
      story.textContent = `No observations are available for the selected countries between ${startYear} and ${endYear}.`;
      return;
    }
    const leader = latestHighest;
    const grower = growthHighest;
    story.innerHTML = `<strong>${startYear}–${endYear}:</strong> among the selected countries, <strong>${leader.country}</strong> has the highest latest spending at <strong>${money(leader.last.spending)} per person (PPP)</strong>. <strong>${grower.country}</strong> shows the largest increase across its available observations in this window (${pct(grower.growth)}%).`;
  }

  function debounce(fn, delay) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, delay); };
  }
})();
