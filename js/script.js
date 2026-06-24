const width = 500;
const height = 300;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("#tooltip");

const countryMapping = {
    "Russia": "Russian Federation",
    "Vietnam": "Viet Nam",
    "South Korea": "Republic of Korea",
    "North Korea": "Democratic People's Republic of Korea",
    "Iran": "Iran (Islamic Republic of)",
    "Syria": "Syrian Arab Republic",
    "Turkey": "Türkiye",
    "Moldova": "Republic of Moldova",
    "Brunei": "Brunei Darussalam",
    "Tanzania": "United Republic of Tanzania",
    "Dominican Rep.": "Dominican Republic",
    "Bolivia": "Bolivia (Plurinational State of)",
    "Venezuela": "Venezuela (Bolivarian Republic of)",
    "Laos": "Lao People's Democratic Republic",
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
    "Dem. Rep. Congo": "Democratic Republic of the Congo",
    "eSwatini": "Eswatini",
    "Solomon Is.": "Solomon Islands",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
    "Macedonia": "North Macedonia",
    "Taiwan": "China, Taiwan Province of",
    "Netherlands": "Netherlands (Kingdom of the)"
};

let selectedYear = "Y2023";
let selectedMetric = "food";

Promise.all([
    d3.json("map/world-topo.json"),
    d3.csv("Data/FoodBalanceSheets_Cleaned.csv")
]).then(function([world, foodData]) {

    const foodRows = foodData.filter(d =>
        d.Item === "Grand Total" &&
        d.Element === "Food supply (kcal/capita/day)"
    );

    const proteinRows = foodData.filter(d =>
        d.Item === "Grand Total" &&
        d.Element === "Protein supply quantity (g/capita/day)"
    );

    const fatRows = foodData.filter(d =>
        d.Item === "Grand Total" &&
        d.Element === "Fat supply quantity (g/capita/day)"
    );

    function buildMetricMap(rows, year){
        const map = {};

        rows.forEach(d => {
            map[d.Area] = +d[year];
        });

        return map;
    }

    let foodSupplyMap = buildMetricMap(foodRows, selectedYear);
    let proteinMap = buildMetricMap(proteinRows, selectedYear);
    let fatMap = buildMetricMap(fatRows, selectedYear);

    function getCurrentMetricMap(){

        if(selectedMetric === "food"){
            return foodSupplyMap;
        }
        if(selectedMetric === "protein"){
            return proteinMap;
        }
        return fatMap;
    }

    function getColorScale(){
        if(selectedMetric === "food"){
            return d3.scaleThreshold()
                .domain([2000,3000])
                .range([
                    "#e74c3c",
                    "#f1c40f",
                    "#4CAF50"
                ]);
        }

        if(selectedMetric === "protein"){
            return d3.scaleThreshold()
                .domain([60,90])
                .range([
                    "#e74c3c",
                    "#f1c40f",
                    "#4CAF50"
                ]);
        }

        return d3.scaleThreshold()
            .domain([50,80])
            .range([
                "#e74c3c",
                "#f1c40f",
                "#4CAF50"
            ]);
    }

    function updateTitleAndLegend(){
        const year = selectedYear.replace("Y","");
        if(selectedMetric === "food"){
            d3.select("#mapTitle")
                .text(`Food Supply in ${year}`);
            d3.select("#legend-low")
                .text("Below 1900");
            d3.select("#legend-medium")
                .text("1900 - 2900");
            d3.select("#legend-high")
                .text("Above 2900");
        }

        else if(selectedMetric === "protein"){
            d3.select("#mapTitle")
                .text(`Protein Supply in ${year}`);
            d3.select("#legend-low")
                .text("Below 60");
            d3.select("#legend-medium")
                .text("60 - 90");
            d3.select("#legend-high")
                .text("Above 90");
        }

        else{
            d3.select("#mapTitle")
                .text(`Fat Supply in ${year}`);
            d3.select("#legend-low")
                .text("Below 50");

            d3.select("#legend-medium")
                .text("50 - 80");
            d3.select("#legend-high")
                .text("Above 80");
        }
    }

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

    const paths = svg.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5);

    function updateMap(){
        updateTitleAndLegend();
        foodSupplyMap = buildMetricMap(foodRows, selectedYear);
        proteinMap = buildMetricMap(proteinRows, selectedYear);
        fatMap = buildMetricMap(fatRows, selectedYear);

        const currentMap = getCurrentMetricMap();
        const colorScale = getColorScale();

        paths
            .transition()
            .duration(500)
            .attr("fill", function(d){

                const country = countryMapping[d.properties.name] || d.properties.name;
                const value = currentMap[country];
                if(value && !isNaN(value)){
                    return colorScale(value);
                }
                return "#d9d9d9";
            });
    }

    paths
        .on("mouseover", function(event, d){

            d3.select(this)
                .attr("fill", "#33abb9");

            const country = countryMapping[d.properties.name] || d.properties.name;
            const currentMap = getCurrentMetricMap();
            const value = currentMap[country];

            let metricName = "";
            let unit = "";

            if(selectedMetric === "food"){
                metricName = "Food Supply";
                unit = "kcal/cap/day";
            }
            else if(selectedMetric === "protein"){
                metricName = "Protein Supply";
                unit = "g/cap/day";
            }
            else{
                metricName = "Fat Supply";
                unit = "g/cap/day";
            }
            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>${country}</strong><br><br>

                    Year:
                    ${selectedYear.replace("Y","")}

                    ${metricName}:<br>
                    ${value ? value.toFixed(1) : "No Data"} ${unit}<br><br>
                `);
        })

        .on("mousemove", function(event){

            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 25) + "px");

        })

        .on("mouseout", function(){

            const currentMap = getCurrentMetricMap();
            const colorScale = getColorScale();

            d3.select(this)
                .attr("fill", function(d){

                    const country =
                        countryMapping[d.properties.name] ||
                        d.properties.name;

                    const value = currentMap[country];

                    if(value && !isNaN(value)){
                        return colorScale(value);
                    }

                    return "#d9d9d9";

                });

            tooltip.style("opacity", 0);

        });

    d3.select("#yearSelect")
        .on("change", function(){

            selectedYear = this.value;

            updateMap();

        });

    d3.select("#metricSelect")
        .on("change", function(){

            selectedMetric = this.value;

            updateMap();

        });

    updateMap();

});