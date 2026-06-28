let stackedData = [];

let stackMode = "percentage";

function initStacked(foodData){

    stackedData = foodData;
    d3.select("#stackMode")
        .on("change", function(){
            stackMode = this.value;
            updateStacked();
        });
    updateStacked();
}

function updateStacked(){

if(!selectedCountry){
    d3.select("#stackedCountry")
        .text("Click a Country");
    d3.select("#stackedYear")
        .text("--");
    d3.select("#stackedContent")
        .classed("hidden", true);
    return;
    }

    d3.select("#stackedContent")
        .classed("hidden", false);

    d3.select("#stackedCountry")
        .text(selectedCountry);

    d3.select("#stackedYear")
        .text(selectedYear.replace("Y",""));

    const vegetalRow =
        stackedData.find(d =>
            d.Area === selectedCountry &&
            d.Item === "Vegetal Products" &&
            d.Element === "Food supply (kcal/capita/day)"
        );

    const animalRow =
        stackedData.find(d =>
            d.Area === selectedCountry &&
            d.Item === "Animal Products" &&
            d.Element === "Food supply (kcal/capita/day)"
        );

    const years = d3.range(2010, 2024);

    const chartData = years.map(year => {
        const y = "Y" + year;
        const vegetal = +vegetalRow[y];
        const animal = +animalRow[y];
        const total = vegetal + animal;
        return{year, vegetal, animal, vegetalPct: total ? vegetal/total*100 : 0, animalPct: total ? animal/total*100 : 0};
    });

    d3.select("#stacked")
    .selectAll("*")
    .remove();

    const current = chartData.find(d => d.year == +selectedYear.replace("Y",""));
    const previous = chartData.find(d => d.year == (+selectedYear.replace("Y","") - 1));
    const totalFood = current.vegetal + current.animal;

    d3.select("#totalFoodValue")
        .text(totalFood.toFixed(0) + " kcal");

    const vegChange = previous ? current.vegetalPct - previous.vegetalPct : 0;
    const animalChange = previous ? current.animalPct - previous.animalPct : 0;

    d3.select("#vegetalValue")
    .text(
        stackMode=="percentage"
        ? current.vegetalPct.toFixed(1)+"%"
        : current.vegetal.toFixed(0)
    );

    d3.select("#animalValue")
    .text(
        stackMode=="percentage"
        ? current.animalPct.toFixed(1)+"%"
        : current.animal.toFixed(0)
    );

    d3.select("#vegetalKcal")
    .text(current.vegetal.toFixed(0)+" kcal/day");

    d3.select("#animalKcal")
    .text(current.animal.toFixed(0)+" kcal/day");

    const changeText = `${vegChange>=0?"▲":"▼"} ${Math.abs(vegChange).toFixed(1)}% vs Previous Year`;

    d3.select("#vegetalChange")
        .text(changeText)
        .style(
            "color",
            vegChange>=0
                ? "#2E7D32"
                : "#D32F2F"
        );

    const animalText = `${animalChange>=0?"▲":"▼"} ${Math.abs(animalChange).toFixed(1)}% vs Previous Year`;

    d3.select("#animalChange")
        .text(animalText)
        .style(
            "color",
            animalChange>=0
                ? "#2E7D32"
                : "#D32F2F"
        );

    const width = 200;
    const height = 200;

    const margin = {
        top:10,
        right:10,
        bottom:30,
        left:25
    };

    const svg =
        d3.select("#stacked")
            .append("svg")
            .attr("width",width)
            .attr("height",height);

    const max =
        stackMode=="percentage"
            ?100
            :current.vegetal+current.animal;

    const y =
        d3.scaleLinear()
            .domain([0,max])
            .range([
                height-margin.bottom,
                margin.top
            ]);

    svg.append("g")
    .attr(
        "transform",
        `translate(${margin.left},0)`
    )
    .call(d3.axisLeft(y));

    const vegetalValue =
        stackMode=="percentage"
            ?current.vegetalPct
            :current.vegetal;

    const animalValue =
        stackMode=="percentage"
            ?current.animalPct
            :current.animal;

    const vegetalBar = svg.append("rect")
        .attr("x",40)
        .attr("width",60)
        .attr("y",height-margin.bottom)
        .attr("height",0)
        .attr("rx",0)
        .attr("fill","#4CAF50")

    const animalBar = svg.append("rect")
        .attr("x",40)
        .attr("width",60)
        .attr("y",height-margin.bottom)
        .attr("height",0)
        .attr("rx",4)
        .attr("fill","#FFB74D")

    vegetalBar
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("y",y(vegetalValue))
        .attr(
            "height",
            height-margin.bottom-y(vegetalValue)
        );

    animalBar
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("y", y(vegetalValue + animalValue))
        .attr(
            "height",
            y(vegetalValue) -
            y(vegetalValue + animalValue)
        );

    vegetalBar
    .on("mouseover", function(event){
        d3.select("#tooltip")
            .style("opacity",1)
            .html(`
            <div class="tooltip-title">
            🌿 Vegetal Products
            </div>

            <div class="tooltip-divider"></div>

            <div class="tooltip-row">
            <span>Food Supply</span>
            <strong>${current.vegetal.toFixed(0)} kcal/day</strong>
            </div>

            <div class="tooltip-row">
            <span>Share</span>
            <strong>${current.vegetalPct.toFixed(1)}%</strong>
            </div>

            <div class="tooltip-row">
            <span>Total Supply</span>
            <strong>${(current.vegetal+current.animal).toFixed(0)} kcal</strong>
            </div>

            <div class="tooltip-row">
            <span>Compared to ${current.year-1}</span>

            <strong style="color:${
            vegChange>=0
            ?"#2E7D32"
            :"#D32F2F"
            }">
            ${vegChange>=0?"▲":"▼"}
            ${Math.abs(vegChange).toFixed(1)}%
            </strong>
            </div>
            `);
    })
    .on("mousemove",function(event){
        d3.select("#tooltip")
            .style("left",(event.pageX+18)+"px")
            .style("top",(event.pageY-20)+"px");
    })
    .on("mouseout",function(){
        d3.select("#tooltip")
            .style("opacity",0);
    });

    animalBar
    .on("mouseover", function(event){
        d3.select("#tooltip")
            .style("opacity",1)
            .html(`
            <div class="tooltip-title">
            🥩 Animal Products
            </div>

            <div class="tooltip-divider"></div>

            <div class="tooltip-row">
            <span>Food Supply</span>
            <strong>${current.animal.toFixed(0)} kcal/day</strong>
            </div>

            <div class="tooltip-row">
            <span>Share</span>
            <strong>${current.animalPct.toFixed(1)}%</strong>
            </div>

            <div class="tooltip-row">
            <span>Total Supply</span>
            <strong>${(current.vegetal+current.animal).toFixed(0)} kcal</strong>
            </div>

            <div class="tooltip-row">
            <span>Compared to ${current.year-1}</span>

            <strong style="color:${
            animalChange>=0
            ?"#2E7D32"
            :"#D32F2F"
            }">
            ${animalChange>=0?"▲":"▼"}
            ${Math.abs(animalChange).toFixed(1)}%
            </strong>
            </div>
            `);
    })
    .on("mousemove",function(event){
        d3.select("#tooltip")
            .style("left",(event.pageX+18)+"px")
            .style("top",(event.pageY-20)+"px");
    })
    .on("mouseout",function(){
        d3.select("#tooltip")
            .style("opacity",0);
    });
}