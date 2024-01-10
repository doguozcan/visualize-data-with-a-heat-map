import "./App.css";
import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";

function App() {
  const [values, setValues] = useState([]);
  const [baseTemperature, setBaseTemperature] = useState(0);
  const [minYear, setMinYear] = useState(0);
  const [maxYear, setMaxYear] = useState(0);
  const mapRef = useRef();

  useEffect(() => {
    async function fetchTemperature() {
      const response = await fetch(
        "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
      );
      const json = await response.json();
      setBaseTemperature(json.baseTemperature);
      setValues(
        json.monthlyVariance.map((i) => ({
          year: i["year"],
          month: i["month"] - 1,
          variance: i["variance"],
        }))
      );
    }

    fetchTemperature();
  }, []);

  useEffect(() => {
    if (values.length === 0) return;

    setMinYear(d3.min(values, (d) => d.year));
    setMaxYear(d3.max(values, (d) => d.year));

    const margin = { top: 10, right: 30, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(mapRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(d3.range(minYear, maxYear + 1))
      .range([0, width]);

    const y = d3.scaleBand().domain(d3.range(0, 12)).range([height, 0]);

    const minVariance = d3.min(values, (d) => d.variance);
    const maxVariance = d3.max(values, (d) => d.variance);

    const colorScale = d3
      .scaleSequential()
      .domain([baseTemperature + minVariance, baseTemperature + maxVariance])
      .interpolator(d3.interpolateCool);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const tooltip = d3
      .select("#tooltip")
      .attr("id", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background-color", "black")
      .style("color", "white")
      .style("border", "2px solid white")
      .style("border-radius", "10px")
      .style("padding", "5px")
      .style("width", "200px");

    svg
      .selectAll(".cell")
      .data(values)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d) => x(d.year))
      .attr("y", (d) => y(d.month))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("data-month", (d) => d.month)
      .attr("data-year", (d) => d.year)
      .attr("data-temp", (d) => baseTemperature + d.variance)
      .attr("fill", (d) => colorScale(baseTemperature + d.variance))
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
        tooltip
          .attr("data-year", d.year)
          .html(
            `Year: ${d.year} - Month: ${monthNames[d.month]}<br>${(
              baseTemperature + d.variance
            ).toFixed(1)}℃<br>${d.variance.toFixed(1)}℃`
          )
          .style("opacity", 0.75)
          .style("left", event.pageX - 100 + "px")
          .style("top", event.pageY - y.bandwidth() - 80 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "none");
        tooltip.style("opacity", 0);
      });

    const xAxis = d3
      .axisBottom(x)
      .tickValues(x.domain().filter((year) => year % 10 === 0));

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("id", "x-axis")
      .call(xAxis);

    svg
      .append("g")
      .attr("id", "y-axis")
      .call(
        d3.axisLeft(y).tickFormat((m) => {
          const d = new Date(0);
          d.setUTCMonth(m);
          return d3.timeFormat("%B")(d);
        })
      );

    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${width / 2 - 300 / 2},${height + 20})`);

    const legendColors = colorScale.ticks(5).map((t) => colorScale(t));

    legend
      .selectAll(".legendRect")
      .data(legendColors)
      .enter()
      .append("rect")
      .attr("class", "legendRect")
      .attr(
        "x",
        (d, i) =>
          (300 / colorScale.ticks(5).map((t) => colorScale(t)).length) * i
      )
      .attr("y", 0)
      .attr("width", 300 / colorScale.ticks(5).map((t) => colorScale(t)).length)
      .attr("height", 30 / 2)
      .attr("fill", (d) => d);

    return () => {
      if (mapRef.current) {
        d3.select(mapRef.current).selectAll("svg").remove();
      }
    };
  }, [values, minYear, maxYear, baseTemperature]);

  return (
    <div className="App">
      <h1 id="title">Monthly Global Land-Surface Temperature</h1>
      <h3 id="description">
        {minYear} - {maxYear}: base temperature {baseTemperature}℃
      </h3>
      <div ref={mapRef}></div>
      <div id="tooltip"></div>
    </div>
  );
}

export default App;
