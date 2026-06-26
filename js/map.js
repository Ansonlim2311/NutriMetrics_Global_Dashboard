function initMap(world, foodData) {

    const width = 400;
    const height = 270;

    const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

    const tooltip = d3.select("#tooltip");

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

    const populationRows = foodData.filter(d =>
        d.Item === "Population" &&
        d.Element === "Total Population - Both sexes"
    );

    let foodSupplyMap = buildMetricMap(foodRows, selectedYear);
    let proteinMap = buildMetricMap(proteinRows, selectedYear);
    let fatMap = buildMetricMap(fatRows, selectedYear);
    let populationMap = buildMetricMap(populationRows, selectedYear);

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
                .domain([2200,3000])
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
                .text("Below 2200");
            d3.select("#legend-medium")
                .text("2200 - 2900");
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

    const g = svg.append("g");

    const paths = g.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5);

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .filter(function(event) {
            return (
                event.type === "wheel" || event.type === "mousedown"
            );
        })
        .on("zoom", function(event){
            g.attr("transform", event.transform);
        });

    svg.call(zoom);
    svg.on("click", function(event) {
        if (event.target.tagName === "svg") {
            tooltipLocked = false;
            selectedCountry = null;
            tooltip.style("opacity", 0);
            d3.select("#selectedCountry")
                .text("Click a Country");
            paths
                .attr("stroke", "white")
                .attr("stroke-width", 0.5);
        }
    })

    function updateMap(){
        updateTitleAndLegend();
        foodSupplyMap = buildMetricMap(foodRows, selectedYear);
        proteinMap = buildMetricMap(proteinRows, selectedYear);
        fatMap = buildMetricMap(fatRows, selectedYear);
        populationMap = buildMetricMap(populationRows, selectedYear);

        const currentMap = getCurrentMetricMap();
        const colorScale = getColorScale();

        paths
            .transition()
            .duration(800)
            .ease(d3.easeCubic)
            .attr("fill", function(d){

                const country = countryMapping[d.properties.name] || d.properties.name;
                const value = currentMap[country];
                if(value && !isNaN(value)){
                    return colorScale(value);
                }
                return "#d9d9d9";
            });
    }

    function updateSelection(){
        paths
            .attr("stroke", function(d){
                const country = countryMapping[d.properties.name] || d.properties.name;

                if(country === selectedCountry) {
                    return "#1565C0";
                }
                return "white";
            })

            .attr("stroke-width", function(d){
                const country = countryMapping[d.properties.name] || d.properties.name;

                if(country === selectedCountry){
                    return 2.5;
                }
                return 0.5;
            });
    }

    function getTooltipData(country) {
        let metricName = "";
        let unit = "";
        let populationText = "No Data";
        let status = "No Data";
        let statusColor = "";
        let worldAverage;
        let currentRows;
        let latestYear = "";
        let latestValue = NaN;
        let population = populationMap[country];
    
        if(selectedMetric === "food"){
            metricName = "Food Supply";
            unit = "kcal/cap/day";
            currentRows = foodRows;
        }
        else if(selectedMetric === "protein"){
            metricName = "Protein Supply";
            unit = "g/cap/day";
            currentRows = proteinRows;
        }
        else{
            metricName = "Fat Supply";
            unit = "g/cap/day";
            currentRows = fatRows;
        }

        const currentRow = currentRows.find(d => d.Area === country);
        const populationRow = populationRows.find(d => d.Area === country);

        if (currentRow) {
            const currentValue = +currentRow[selectedYear];
            if (isNaN(currentValue) && currentValue > 0) {
                latestValue = currentValue;
                latestYear = selectedYear.replace("Y", "");
            } else {
                const latest = getLatestAvailable(currentRow);
                if (latest) {
                    latestYear = latest.year.replace("Y","");
                    latestValue = latest.value;
                }
            }
        }

        const compareYear = "Y" + latestYear;

        if (populationRow) {
            if (isNaN(population) || population <= 0) {
                const latestPopulation = getLatestAvailable(populationRow);
                if (latestPopulation) {
                    population = latestPopulation.value;
                }
            }
            if (!isNaN(population) && population > 0) {
                populationText = (population/1000).toFixed(2) + " million"
            }
        }

        if (latestValue && !isNaN(latestValue)) {
            if (selectedMetric === "food") {
                if (latestValue < 2200) {
                    status = "Low";
                    statusColor = "#e74c3c";
                }
                else if (latestValue < 3000) {
                    status = "Medium";
                    statusColor = "#f1c40f";
                }
                else {
                    status = "High";
                    statusColor = "#4CAF50";
                }
            }
            else if (selectedMetric === "protein") {
                if (latestValue < 60) {
                    status = "Low";
                    statusColor = "#e74c3c";
                }
                else if (latestValue < 90) {
                    status = "Medium";
                    statusColor = "#f1c40f";
                }
                else {
                    status = "High";
                    statusColor = "#4CAF50";
                }
            }
            else {
                if (latestValue < 50) {
                    status = "Low";
                    statusColor = "#e74c3c";
                }
                else if (latestValue < 80) {
                    status = "Medium";
                    statusColor = "#f1c40f"
                }
                else {
                    status = "High";
                    statusColor = "#4CAF50";
                }
            }
        }

        if (selectedMetric === "food") {
            worldAverage = getWorldValue(foodRows, compareYear);
        }
        else if (selectedMetric === "protein") {
            worldAverage = getWorldValue(proteinRows, compareYear);
        }
        else {
            worldAverage = getWorldValue(fatRows, compareYear);
        }

        const difference = latestValue - worldAverage;
        const percent = (difference/worldAverage) * 100;
        let symbol;

        if (difference >= 0) {
            symbol = "+";
        }
        else {
            symbol = "-";
        }

        return {
            metricName, unit, latestYear, latestValue, populationText, status, statusColor,
            worldAverage, difference, percent, symbol
        };
    }

    function showTooltip(event, country) {
        const data = getTooltipData(country);

        tooltip
            .style("opacity", 1)
            .style("left",(event.pageX+15)+"px")
            .style("top", (event.pageY-25)+"px")
            .html(`
                <div class="tooltip-title">
                    <strong>${country}</strong>
                </div>
                <table class="tooltip-table">
                    <tr>
                        <td>Year</td>
                        <td>${selectedYear.replace("Y","")}</td>
                    </tr>
                    <tr>
                        <td>Using Data From</td>
                        <td>${data.latestYear}</td>
                    <tr>
                        <td>Population</td>
                        <td>${data.populationText}</td>
                    </tr>
                    <tr>
                        <td>${data.metricName}</td>
                        <td>${data.latestValue ? data.latestValue.toFixed(1) : "No Data"} ${data.unit}</td>
                    </tr>
                    <tr>
                        <td>Status</td>
                        <td style="color:${data.statusColor}; font-weight:bold;">
                            ${data.status}
                        </td>
                    </tr>
                    <tr>
                        <td>World Average</td>
                        <td>${data.worldAverage ? data.worldAverage.toFixed(1) : "No Data"} ${data.unit}</td>
                    </tr>
                    <tr>
                        <td>Difference</td>
                        <td>${data.symbol}${data.difference.toFixed(1)} (${data.symbol}${data.percent.toFixed(1)}%)</td>
                    </tr>
                </table>
            `);
    }

    paths
        .on("click", function(event, d){
            const country = countryMapping[d.properties.name] || d.properties.name;
            selectedCountry = country
            updateWaterfall();
            tooltipLocked = true;
            d3.select("#selectedCountry")
                .text(selectedCountry);
            updateSelection();
            showTooltip(event, country);
        })

        .on("mouseover", function(event, d){
            if (countryMapping[d.properties.name] || d.properties.name !== selectedCountry) {
                d3.select(this)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5);
            }

            const country = countryMapping[d.properties.name] || d.properties.name;
            const currentMap = getCurrentMetricMap();
            const value = currentMap[country];
            
            if (!tooltipLocked) { 
                showTooltip(event, country);
            }
        })

        .on("mousemove", function(event){
            if (!tooltipLocked) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 25) + "px");
            }
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

                })
                if (!tooltipLocked) {
                    tooltip.style("opacity", 0);
                }
                updateSelection();
            });

    d3.select("#yearSelect")
        .on("change", function(){
            selectedYear = this.value;
            updateMap();
            updateWaterfall();
        });

    d3.select("#resetZoom")
        .on("click", function() {
            svg.transition()
                .duration(500)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                );
        });

    d3.select("#metricSelect")
        .on("change", function(){
            selectedMetric = this.value;
            updateMap();
        });
    updateMap();
    updateSelection();
}