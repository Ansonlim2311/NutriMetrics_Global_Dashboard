const width = 700;
const height = 400;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("#tooltip");

Promise.all([
    d3.json("map/world-topo.json"),
    d3.csv("Data/FoodBalanceSheets_Cleaned.csv")
]).then(function([world, foodData]) {
    
    const foodSupply2023 = foodData.filter(d =>
    d.Item === "Grand Total" &&
    d.Element === "Food supply (kcal/capita/day)"
    );

    const foodMap = {};
    foodSupply2023.forEach(d => {
        foodMap[d.Area] = +d.Y2023;
    });

    const colorScale = d3.scaleSequential()
        .domain([
            d3.min(foodSupply2023, d=> +d.Y2023),
            d3.max(foodSupply2023, d=> +d.Y2023)
        ]).interpolator(d3.interpolateYlGn);

    const countries = topojson.feature(
        world,
        world.objects.countries
    );
    // console.log(countries.features[0].properties);
    // console.log(foodMap["Malaysia"]);
    // console.log(foodMap["Japan"]);
    // console.log(foodMap["China"]);

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
        // .attr("fill", "#90CAF9")
        .attr("fill", function(d){
            const value = foodMap[d.properties.name];
            if (value) {
                return colorScale(value);
            }
            else {
                return "#d9d9d9";
            }
        })
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)

        .on("mouseover", function(event, d){
            d3.select(this)
                .attr("fill", "#33abb9");
            const value = foodMap[d.properties.name];
            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.properties.name}</strong><br>
                    Food Supply: ${value ? value.toFixed(1) : "No Data"} kcal/capita/day
    `           );
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
                .attr("fill", function(d){
                const value = foodMap[d.properties.name];
                if (value) {
                    return colorScale(value);
                }
                else {
                    return "#d9d9d9";
                }
            })
            tooltip
                .style("opacity", 0);
        });
});