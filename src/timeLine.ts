import * as d3 from 'd3';
import { data as chartData } from './data';
let data: any = chartData
data.dates = data.dates.map((strDate: string) => {
    return new Date(strDate);
})
console.log(data);
let width = 900;
let height = 500;
let colours = d3.schemePaired;

// focus 
var focusChartMargin = { top: 20, right: 20, bottom: 170, left: 60 };
var focusChartHeight = height - focusChartMargin.top - focusChartMargin.bottom;
var chartWidth       = width - focusChartMargin.left - focusChartMargin.right; // chart width
var yFocus           = d3.scaleLinear().nice().range([focusChartHeight, 0]);
var xFocus           = d3.scaleTime().range([0, chartWidth]);
var xAxisFocus       = d3.axisBottom(xFocus).ticks(10);
var yAxisFocus       = d3.axisLeft(yFocus).tickFormat((d: any) => d);
var lineFocus        = d3.line().curve(d3.curveCatmullRom).defined((d: any) => !isNaN(d)).x((d, i) => xFocus(data.dates[i])).y((d: any, i) => yFocus(d));
 
xFocus.domain(d3.extent(data.dates) as any);
yFocus.domain([0, d3.max(data.series, (d: any) => d3.max(d.values)) as any]);
// context
var contextChartMargin = { top: height - 140, right: 20, bottom: 70, left: 60 };
var contextChartHeight = height - contextChartMargin.top - contextChartMargin.bottom;
var yContext           = d3.scaleLinear().nice().range([contextChartHeight, 0]);
var xContext           = d3.scaleTime().range([0, chartWidth]);
var xAxisContext       = d3.axisBottom(xContext).ticks(10);
var lineContext        = d3.line().curve(d3.curveCatmullRom).defined((d: any) => !isNaN(d)).x((d, i) => xContext(data.dates[i])).y((d: any) => yContext(d));

xContext.domain(d3.extent(data.dates) as any);
yContext.domain(yFocus.domain());
// chart 
// var chartWidth = width - focusChartMargin.left - focusChartMargin.right;
var svg:               any;
var focus:             any;
var context:           any;
var focusChartLines:   any;
var brushHandle:       any;
// event callback
/** brush */
var brush = d3.brushX().extent([[0, -10], [chartWidth, contextChartHeight]]).on("brush end", brushed);
/** zoom */
var zoom = d3.zoom()
                .scaleExtent([1, Infinity])
                .translateExtent([[0, 0], [chartWidth, focusChartHeight]])
                .extent([[0, 0], [chartWidth, focusChartHeight]])
                .on("zoom", zoomed)
                .filter(
                () =>
                    d3.event.ctrlKey ||
                    d3.event.type === "dblclick" ||
                    d3.event.type === "mousedown"
                );

export function initChart() {
    svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height);
    // clip 
    svg.attr("width", chartWidth + focusChartMargin.left + focusChartMargin.right)
       .attr(
            "height",
            focusChartHeight + focusChartMargin.top + focusChartMargin.bottom
        );
    // clip 
    var clip = svg
        .append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", chartWidth)
        .attr("height", focusChartHeight)
        .attr("x", 0)
        .attr("y", 0);

    // create focus chart
    focusChartLines = svg
        .append("g")
        .attr("class", "focus")
        .attr(
            "transform",
            "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")"
        )
        .attr("clip-path", "url(#clip)");
    // create focus chart
    focus = svg
        .append("g")
        .attr("class", "focus")
        .attr(
            "transform",
            "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")"
        );    
    // create context chart
    context = svg
        .append("g")
        .attr("class", "context")
        .attr("fill", "none")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr(
        "transform",
        "translate(" +
            contextChartMargin.left +
            "," +
            (contextChartMargin.top + 50) +
            ")"
        );

    // add axis to focus chart
    focus
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + focusChartHeight + ")")
        .call(xAxisFocus);
    focus
        .append("g")
        .attr("class", "y-axis")
        .call(yAxisFocus);
    // focus lines 
    focusChartLines
        .selectAll("path")
        .data(data.series)
        .join("path")
        .attr("class", "line")
        .attr("d", (d: any) => lineFocus(d.values))
        .attr("fill", "none")
        .style("mix-blend-mode", "multiply")
        .attr("stroke-dasharray", (d: any) => d.stroke || "")
        .attr("stroke", (d: any, i: number) => colours[i])
        .attr("stroke-width", (d: any) => (d.stroke ? 1 : 1.5))
        .attr("stroke-opacity", (d: any) => (d.stroke ? 0.7 : null));

 
    context
        .selectAll("path")
        .data(data.series)
        .join("path")
        .attr("class", "line")
        .attr("d", (d: any) => lineContext(d.values))
        .attr("fill", "none")
        .style("mix-blend-mode", "multiply")
        .attr("stroke-dasharray", (d: any) => d.stroke || "")
        .attr("stroke", (d: any, i: number) => colours[i])
        .attr("stroke-width", (d: any) => (d.stroke ? .75 : 1.25))
        .attr("stroke-opacity", (d: any) => (d.stroke ? 0.7 : null));

    // add x axis to context chart (y axis is not needed)
    context
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + contextChartHeight + ")")
        .call(xAxisContext);     
    
    var contextBrush = context
        .append("g")
        .attr("class", "brush")
        .call(brush);

    brushHandle = contextBrush
        .selectAll(".handle--custom")
        .data([{ type: "w" }, { type: "e" }])
        .enter()
        .append("path")
        .attr("class", "handle--custom")
        .attr("stroke", "#000")
        .attr("cursor", "ew-resize")
        .attr("d", brushHandlePath);

    svg
        .append("rect")
        .attr("cursor", "move")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .attr("class", "zoom")
        .attr("width", chartWidth)
        .attr("height", focusChartHeight)
        .attr(
          "transform",
          "translate(" + focusChartMargin.left + "," + focusChartMargin.top + ")"
        )
        .call(zoom);
    
    contextBrush.call(brush.move, [0, chartWidth / 2]);

    // focus chart x label
    focus
        .append("text")
        .attr(
            "transform",
            "translate(" +
            chartWidth / 2 +
            " ," +
            (focusChartHeight + focusChartMargin.top + 25) +
            ")"
        )
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Time");

    // focus chart y label
    focus
        .append("text")
        .attr("text-anchor", "middle")
        .attr(
            "transform",
            "translate(" +
            (-focusChartMargin.left + 20) +
            "," +
            focusChartHeight / 2 +
            ")rotate(-90)"
        )
        .style("font-size", "18px")
        .text(data.y);

    document.body.append(svg.node()); 
}

function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xContext.range();
    xFocus.domain(s.map(xContext.invert, xContext));
    focusChartLines.selectAll("path").attr("d", (d: any) => lineFocus(d.values));
    focus.select(".x-axis").call(xAxisFocus);
    svg
      .select(".zoom")
      .call(
        zoom.transform,
        d3.zoomIdentity.scale(chartWidth / (s[1] - s[0])).translate(-s[0], 0)
      );
    brushHandle
      .attr("display", null)
      .attr(
        "transform",
        (d: any, i: number) => "translate(" + [s[i], -contextChartHeight - 20] + ")"
      );
}


function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    xFocus.domain(t.rescaleX(xContext).domain());
    focusChartLines.selectAll("path").attr("d", (d: any) => lineFocus(d.values));
    focus.select(".x-axis").call(xAxisFocus);
    var brushSelection = xFocus.range().map(t.invertX, t);
    context.select(".brush").call(brush.move, brushSelection);
    brushHandle
        .attr("display", null)
        .attr(
        "transform",
        (d: any, i: number) =>
            "translate(" + [brushSelection[i], -contextChartHeight - 20] + ")"
        );
}





function brushHandlePath(d: any) {
    var e = +(d.type === "e"),
    x = e ? 1 : -1,
    y = contextChartHeight + 10;
    return (
        "M" +
        0.5 * x +
        "," +
        y +
        "A6,6 0 0 " +
        e +
        " " +
        6.5 * x +
        "," +
        (y + 6) +
        "V" +
        (2 * y - 6) +
        "A6,6 0 0 " +
        e +
        " " +
        0.5 * x +
        "," +
        2 * y +
        "Z" +
        "M" +
        2.5 * x +
        "," +
        (y + 8) +
        "V" +
        (2 * y - 8) +
        "M" +
        4.5 * x +
        "," +
        (y + 8) +
        "V" +
        (2 * y - 8)
    ); 
}