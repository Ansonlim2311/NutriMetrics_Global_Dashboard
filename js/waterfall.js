let selectedFood = "Cereals - Excluding Beer"
let waterfallData = [];

const foods = [
    {value:"Cereals - Excluding Beer", label:"Cereals"},
    {value:"Vegetables", label:"Vegetables"},
    {value:"Fruits - Excluding Wine", label:"Fruits"},
    {value:"Meat", label:"Meat"},
    {value:"Fish, Seafood", label:"Fish & Seafood"},
    {value:"Eggs", label:"Eggs"},
    {value:"Milk - Excluding Butter", label:"Milk"},
    {value:"Pulses", label:"Pulses"},
    {value:"Starchy Roots", label:"Starchy Roots"}
];

function initWaterfall(foodData) {
    waterfallData = foodData;

    const foodSelect = d3.select("#foodSelect")
        .on("change", function() {
            selectedFood = this.value;
            updateWaterfall();
        });
        foodSelect
            .selectAll("option")
            .data(foods)
            .enter()
            .append("option")
            .attr("value", d => d.value)
            .text(d => d.label);
}

function updateWaterfall(){
    if(!selectedCountry){
        d3.select("#waterfallSubtitle").text("Click a country on the map");
        d3.select("#waterfallYear").text("");
        return;
    }
    d3.select("#waterfallCountry").text(selectedCountry);
    d3.select("#waterfallYear").text(`${selectedFood} | ${selectedYear.replace("Y", "")}`);

    const productionRow = waterfallData.find(d =>
        d.Area === selectedCountry && d.Item === selectedFood && d.Element === "Production"
    );
    const domesticRow = waterfallData.find(d =>
        d.Area === selectedCountry && d.Item === selectedFood && d.Element === "Domestic supply quantity"
    );
    const foodRow = waterfallData.find(d =>
        d.Area === selectedCountry && d.Item === selectedFood && d.Element === "Food"
    );
    const worldDomestic = waterfallData.find(d =>
        d.Area === "World" && d.Item === selectedFood && d.Element === "Domestic supply quantity"
    );
    const worldFood = waterfallData.find(d =>
        d.Area === "World" && d.Item === selectedFood && d.Element === "Food"
    );

    const production = productionRow ? +productionRow[selectedYear] : 0;
    const domestic = domesticRow ? +domesticRow[selectedYear] : 0;
    const food = foodRow ? +foodRow[selectedYear] : 0;
    const countryRate = domestic === 0 ? 0 : (food / domestic) * 100;
    const worldDomesticValue = worldDomestic ? +worldDomestic[selectedYear] : 0;
    const worldFoodValue = worldFood ? +worldFood[selectedYear] : 0;

    const change1 = domestic - production;
    const percent1 = production === 0 ? 0 : (change1 / production) * 100;
    const change2 = food - domestic;
    const percent2 = domestic === 0 ? 0 : (change2 / domestic) * 100;
    const utilization = domestic === 0 ? 0 : (food / domestic) * 100;
    const color1 = change1 >= 0 ? "#2e7d32" : "#d32f2f";
    const color2 = change2 >= 0 ? "#2e7d32" : "#d32f2f";
    const sign1 = change1 >= 0 ? "+" : "-";
    const sign2 = change2 >= 0 ? "+" : "-";
    const worldRate = worldDomesticValue === 0 ? 0 : (worldFoodValue / worldDomesticValue) * 100;
    const difference = utilization - worldRate;
    const symbol = difference >= 0 ? "+" : "";
    const diffCard = d3.select("#worldDifference");
    if (difference >= 0){
        diffCard.style("color", "#2e7d32").text(`▲ ${difference.toFixed(1)}% vs World`);
    }
    else {
        diffCard.style("color", "#d32f2f").text(`▼ ${Math.abs(difference).toFixed(1)}% vs World`);
    }

    d3.select("#worldRate").text(worldRate.toFixed(1) + "%");
    d3.select("#consumptionRate").text(utilization.toFixed(1) + "%");
    d3.select("#waterfall")
    .html(`
        <div class="flow-container">
            <div class="flow-box">
                <div class="flow-title">Production</div>
                <div class="flow-value">${formatTonnes(production)}</div>
            </div>

            <div class="flow-arrow">
                <div class="flow-change" style="color:${color1}">
                    ${sign1}${formatTonnes(Math.abs(change1))}
                    <br>
                    (${percent1.toFixed(1)}%)
                </div>
                <div class="arrow">➜</div>
            </div>

            <div class="flow-box">
                <div class="flow-title">Domestic Supply</div>
                <div class="flow-value">${formatTonnes(domestic)}</div>
            </div>

            <div class="flow-arrow">
                <div class="flow-change" style="color:${color2}">
                    ${sign2}${formatTonnes(Math.abs(change2))}
                    <br>
                    (${percent2.toFixed(1)}%)
                </div>
                <div class="arrow">➜</div>
            </div>

            <div class="flow-box">
                <div class="flow-title">Food Available</div>
                <div class="flow-value">${formatTonnes(food)}</div>
            </div>
        </div>
        `)
}