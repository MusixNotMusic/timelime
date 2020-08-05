import * as d3 from 'd3';
// import { data } from './data1';
import { data1 as data, keys } from './data_cate';
import * as _ from 'lodash';
let contextWidth  = 910;
let contextHeight = 390;
let focusHeight   = 50;
let margin = {top: 10, right: 10, bottom: 100, left: 40}
let margin2 = { top: 430, right: 10, bottom: 20, left: 40 }
var chartWidth    = contextWidth - margin2.left - margin2.right; // chart width

let colors: any = {
  other: "#4b1a26",
  musix: "#c05c28",
  joe: "#ed1d48",
  lee: "#8cc63f",
  sanma: "#7e1832",
  link: "#fed23e",
  job: "#f1696a",
  tink: "#57c5c7",
  ketty: "#fbab40",
}

data.forEach((d: any) => { d.date = [new Date(d.date),  new Date(new Date(d.date).getTime() + (Math.random() * 1e10)) ]})
console.log('data === >', data);
let minArr: any = data.map((d: any) => d.date[0]);
let maxArr: any = data.map((d: any) => d.date[1]);
// let minTime = Math.min(minArr);
// let maxTime = Math.max(maxArr);

let xFocus = d3.scaleTime()
    .range([0, contextWidth])
    // .domain(d3.extent(data.map((d: any) => d.date[0])) as any)
    .domain(d3.extent(minArr.concat(maxArr)) as any);

// let y = d3.scaleLinear()
//     .range([contextHeight, 0])
//     .domain([0, d3.max(data.map((d: any) => d.price)) as any])
let y = d3.scaleBand()
    .domain(keys)
    .range([contextHeight, 0])
    // .paddingInner([0.4]);


let xContext: any = d3.scaleTime()
    .range([0, contextWidth])
    .domain(xFocus.domain())

// let y2 = d3.scaleLinear()
//     .range([focusHeight, 0])
//     .domain(y.domain())

let y2 = d3.scaleBand()
    .range([focusHeight, 10])
    .domain(y.domain())

let area: any = d3.area()
        .curve(d3.curveMonotoneX)
        .x((d: any) => xFocus(d.date))
        .y0(contextHeight)
        .y1((d: any) => y(d.key))

let area2 :any = d3.area()
            .curve(d3.curveMonotoneX)
            .x((d: any) => xContext(d.date))
            .y0(focusHeight)
            .y1((d: any) => y2(d.key))

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

let _timestampFocusPathUpdate = _.throttle(timestampFocusPathUpdate, 100);
// let _timestampFocusPathUpdate = _.debounce(timestampFocusPathUpdate, 10);

function zoomed() {
    // console.log('zoomed', d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type );
    if (d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    xFocus.domain(t.rescaleX(xContext).domain());
    // focus.selectAll(".area").attr("d", area);
    // timestampFocusPath(focus);
    _timestampFocusPathUpdate(focus);
    focus.select(".x-axis").call(xAxis);
    var brushSelection = xFocus.range().map(t.invertX, t);
    context.select(".brush").call(brush.move, brushSelection);
}

function brushed() {
    if (d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || xContext.range();
    xFocus.domain(s.map(xContext.invert, xContext));
    // d3.select(chart).select(".area").attr("d", area);
    // timestampFocusPath(focus);
    _timestampFocusPathUpdate(focus);
    d3.select(chart).select(".x-axis").call(xAxis);
    svg.select(".zoom")
       .call(
        zoom.transform,
        d3.zoomIdentity.scale(chartWidth / (s[1] - s[0])).translate(-s[0], 0)
    );
}
function timestampFocusPath(dom: any) {
  dom.select('.timestampG').remove();
  let timestampG = dom.append('g').attr('class', 'timestampG').attr("clip-path", 'url(#clip)').attr("height", '100%').attr("transform", `translate(0, 25)`);
  data.forEach((item: any) => {
    let s1: any = item.date[0];
    let s2: any = item.date[1];
    // console.log('item ==>', item, s1, s2);

    let key: any = item.key;
    let x1 = xFocus(s1);
    let x2 = xFocus(s2);
    let _y = y(key);
    let timeItem = timestampG.append('g').attr('class', 'time-item').attr('source-data', JSON.stringify(item))
        // .attr("transform", `translate(${margin.left},${margin.top})`);
    timeItem.append('circle')
            .attr('class', 'time-item-left')
            .attr('cx', x1)
            .attr('cy', _y)
            .attr('r', 5)
            .attr('fill', colors[item.key])
    
    timeItem.append('circle')
            .attr('class', 'time-item-right')
            .attr('cx', x2)
            .attr('cy', _y)
            .attr('r', 5)
            .attr('fill', colors[item.key])

    timeItem.append('rect')
            .attr('width', x2 - x1)
            .attr('class', 'time-item-link')
            .attr('height', 1)
            .attr('x', x1)
            .attr('y', _y)
            .attr('fill', colors[item.key])
    
  })

  // context.append("path")
  //     .datum(data)
  //     .attr("class", "timestamp-area")
  //     .attr("fill", "steelblue")
  //     .attr("clip-path", 'url(#clip)')
  //     .attr("d", area2);
}

function timestampFocusPathUpdate(dom: any) {
  const timelines = dom.selectAll('.time-item');
  // console.log('timelines =>', timelines, timelines._groups);
  timelines._groups[0].forEach((_dom: any) => {
      // console.log('dom ==>', _dom);
      let jsonData = d3.select(_dom).attr('source-data');
      let data = JSON.parse(jsonData);
      // console.log('jsonData ==>', jsonData, data);
      let s1 = new Date(data.date[0]);
      let s2 = new Date(data.date[1]);
      // let key = data.key;
      let x1 = xFocus(s1);
      let x2 = xFocus(s2);
      d3.select(_dom).select('.time-item-left').attr('cx', x1)
      d3.select(_dom).select('.time-item-right').attr('cx', x2)
      d3.select(_dom).select('.time-item-link').attr('x', x1).attr('width', x2 - x1)
  })
}

function timestampContextPath(dom: any) {
  let timestampG = dom.append('g').attr('class', 'timestampG').attr("clip-path", 'url(#clip)');
  data.forEach((item: any) => {
    let s1: any = item.date[0];
    let s2: any = item.date[1];
    // console.log('item ==>', item, s1, s2);

    let key: any = item.key;
    let x1 = xContext(s1);
    let x2 = xContext(s2);
    let _y = y2(key);
    let timeItem = timestampG.append('g')
    timeItem.append('circle')
            .attr('class', 'left')
            .attr('cx', x1)
            .attr('cy', _y)
            .attr('r', 2)
            .attr('fill', colors[item.key])
    
    timeItem.append('circle')
            .attr('class', 'right')
            .attr('cx', x2)
            .attr('cy', _y)
            .attr('r', 2)
            .attr('fill', colors[item.key])

    timeItem.append('rect')
            .attr('width', x2 - x1)
            .attr('height', 1)
            .attr('x', x1)
            .attr('y', _y)
            .attr('fill', colors[item.key])
    
  })
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
        .attr("height", contextHeight + margin.top);

    focus = svg.append("g")
      .attr("class", "focus")
      .attr("fill", "")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    context = svg.append("g")
      .attr("class", "context")
      .attr("transform", `translate(${margin2.left},${margin2.top})`);
  
    // focus.append("path")
    //   .datum(data)
    //   .attr("class", "area")
    //   .attr("fill", "steelblue")
    //   .attr("clip-path", 'url(#clip)')
    //   .attr("d", area);

    timestampFocusPath(focus);
  
    focus.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${contextHeight})`)
      .call(xAxis);
  
    focus.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    
  
    // context.append("path")
    //   .datum(data)
    //   .attr("class", "area")
    //   .attr("fill", "steelblue")
    //   .attr("clip-path", 'url(#clip)')
    //   .attr("d", area2);
    
    timestampContextPath(context);
    
  
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