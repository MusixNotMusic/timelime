import * as d3 from 'd3';
import { data } from './data1';
// import { data, keys } from './data_cate';

let contextWidth  = 910;
let contextHeight = 390;
let focusHeight   = 50;
let margin = ({top: 10, right: 10, bottom: 100, left: 40})
let margin2 = ({ top: 430, right: 10, bottom: 20, left: 40 })
var chartWidth    = contextWidth - margin2.left - margin2.right; // chart width

data.forEach((d: any) => { d.date = new Date(d.date)})

let xFocus = d3.scaleTime()
    .range([0, contextWidth])
    .domain(d3.extent(data.map((d: any) => d.date)) as any)

let y = d3.scaleLinear()
    .range([contextHeight, 0])
    .domain([0, d3.max(data.map((d: any) => d.price)) as any])
// let y = d3.scaleBand()
//     .domain(keys)
//     .range([contextHeight, 0])
    // .paddingInner([0.4]);


let xContext: any = d3.scaleTime()
    .range([0, contextWidth])
    .domain(xFocus.domain())

let y2 = d3.scaleLinear()
    .range([focusHeight, 0])
    .domain(y.domain())

// let y2 = d3.scaleBand()
//     .range([focusHeight, 0])
//     .domain(y.domain())

let area: any = d3.area()
        .curve(d3.curveMonotoneX)
        .x((d: any) => xFocus(d.date))
        .y0(contextHeight)
        .y1((d: any) => y(d.price))

let area2 :any = d3.area()
            .curve(d3.curveMonotoneX)
            .x((d: any) => xContext(d.date))
            .y0(focusHeight)
            .y1((d: any) => y2(d.price))

let yAxis = d3.axisLeft(y)
let xAxis = d3.axisBottom(xFocus)
let xAxis2 = d3.axisBottom(xContext);

// chart 
let context: any;
let focus:   any;
let svg:     any;
// brush 
var brush = d3.brushX().extent([[0, -10], [contextWidth, contextHeight]]).on("brush", brushed);
 
// zoom 
var zoom = d3.zoom()
                .scaleExtent([1, Infinity])
                .translateExtent([[0, 0], [contextWidth, focusHeight]])
                .extent([[0, 0], [contextWidth, focusHeight]])
                .on("zoom", zoomed)
                .filter(
                () =>
                    d3.event.ctrlKey ||
                    d3.event.type === "dblclick" ||
                    d3.event.type === "mousedown"
                );
  
let chart: any;


function zoomed() {
    console.log('zoomed', d3.event.sourceEvent && d3.event.sourceEvent.type );
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    xFocus.domain(t.rescaleX(xContext).domain());
    // let extent = d3.event.selection.map(xContext.invert, xContext);
    // xFocus.domain(extent);
    focus.selectAll(".area").attr("d", area);
    focus.select(".x-axis").call(xAxis);
    var brushSelection = xFocus.range().map(t.invertX, t);
    context.select(".brush").call(brush.move, brushSelection);
}

function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xContext.range();
    xFocus.domain(s.map(xContext.invert, xContext));
    // let extent = d3.event.selection.map(xContext.invert, xContext);
    // xFocus.domain(extent);
    d3.select(chart).select(".area").attr("d", area);
    d3.select(chart).select(".x-axis").call(xAxis);
    svg.select(".zoom")
       .call(
        zoom.transform,
        d3.zoomIdentity.scale(chartWidth / (s[1] - s[0])).translate(-s[0], 0)
    );
}

function initChart()  {
    svg = d3.create('svg').attr('width', contextWidth + margin.left).attr('height', contextHeight + margin.top + margin.bottom)
    // const el = (contextWidth + margin.left + margin.right, height + margin.top + margin.bottom)
    // const svg = d3.select(el)
  
    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
        .attr("width", contextWidth)
        .attr("height", contextHeight);

    focus = svg.append("g")
      .attr("class", "focus")
      .attr("fill", "")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    context = svg.append("g")
      .attr("class", "context")
      .attr("transform", `translate(${margin2.left},${margin2.top})`);
  
    focus.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("fill", "steelblue")
      .attr("clip-path", 'url(#clip)')
      .attr("d", area);
  
    focus.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${contextHeight})`)
      .call(xAxis);
  
    focus.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
  
    context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("fill", "steelblue")
      .attr("clip-path", 'url(#clip)')
      .attr("d", area2);
  
    context.append("g")
      .attr("class", "x-axis")
      .attr("transform",  `translate(0,${focusHeight})`)
      .call(xAxis2);
  
    context.append("g")
      .attr("class", "x brush")
      .call(brush)

    svg.append("rect")
      .attr("cursor", "move")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .attr("class", "zoom")
      .attr("width", contextWidth)
      .attr("height", contextHeight)
      .attr(
        "transform",
        "translate(" + margin.left + "," + margin.top + ")"
      )
      .call(zoom);
    chart = svg.node();
    return svg.node();
}

export function init() {
    initChart();
    // brush();
    document.body.append(chart);
}