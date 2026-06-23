const width = 700;
const height = 400;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("#tooltip");

d3.json("map/world-topo.json").then(function(world){

    const countries = topojson.feature(
        world,
        world.objects.countries
    );

    const projection = d3.geoMercator()
    .fitSize([width, height], {
        type: "FeatureCollection",
        features: countries.features.filter(d => d.id !== "010")
    });
        
    const path = d3.geoPath()
        .projection(projection);

    svg.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#90CAF9")
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)

        .on("mouseover", function(event, d){
            d3.select(this)
                .attr("fill", "#2E7D32");
            tooltip
                .style("opacity", 1)
                .html("<strong>" + d.properties.name + "</strong>");
        })

        // Mouse Move
        .on("mousemove", function(event){
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 25) + "px");
        })

        // Mouse Leave
        .on("mouseout", function(){
            d3.select(this)
                .attr("fill", "#90CAF9");
            tooltip
                .style("opacity", 0);
        });
});