let scatterData = [];

const legendData = [
    {color:"#8E44AD", label:"Selected Country"}
];
function initScatter(foodData){
    scatterData = foodData;
    updateScatter();
}

function updateScatter(){

    const countries =
        [...new Set(
            scatterData
            .map(d=>d.Area)
        )]
        .filter(d=>d!="World");

    const scatter = [];

    countries.forEach(country=>{
        const proteinRow =
            scatterData.find(d=>
            d.Area===country && d.Item==="Grand Total" && d.Element==="Protein supply quantity (g/capita/day)"
            );

        const fatRow =
            scatterData.find(d=> d.Area===country && d.Item==="Grand Total" && d.Element==="Fat supply quantity (g/capita/day)"
            );

        const populationRow =
            scatterData.find(d=> d.Area===country && d.Item==="Population" && d.Element==="Total Population - Both sexes"
            );

        if(proteinRow && fatRow && populationRow){
            scatter.push({
                country,
                protein:+proteinRow[selectedYear],
                fat:+fatRow[selectedYear],
                population:+populationRow[selectedYear]
            });
        }
    });

    d3.select("#scatter").selectAll("*").remove();
    const margin = {
        top: 20,
        right: 30,
        bottom: 60,
        left: 70
    };

    const width = 480;
    const height = 300;

    const svg = d3.select("#scatter")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const worldProtein = scatterData.find(d =>
        d.Area === "World" &&
        d.Item === "Grand Total" &&
        d.Element === "Protein supply quantity (g/capita/day)"
    );

    const worldFat = scatterData.find(d =>
        d.Area === "World" &&
        d.Item === "Grand Total" &&
        d.Element === "Fat supply quantity (g/capita/day)"
    );

    const avgProtein = +worldProtein[selectedYear];
    const avgFat = +worldFat[selectedYear];

    const x = d3.scaleLinear()
        .domain([
            d3.min(scatter, d => d.fat) - 5,
            d3.max(scatter, d => d.fat) + 5
        ])
        .range([
            margin.left,
            width - margin.right
        ]);

    const y = d3.scaleLinear()
        .domain([
            d3.min(scatter, d => d.protein) - 5,
            d3.max(scatter, d => d.protein) + 5
        ])
        .range([
            height - margin.bottom,
            margin.top
        ]);

    svg.append("g")
        .attr(
            "transform",
            `translate(0,${height-margin.bottom})`
        )
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr(
            "transform",
            `translate(${margin.left},0)`
        )
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("font-size", 14)
        .attr("x", width/2)
        .attr("y", height-15)
        .attr("text-anchor","middle")
        .text("Fat Supply (g/capita/day)");

    svg.append("text")
        .attr(
            "transform",
            "rotate(-90)"
        )
        .attr("font-size", 14)
        .attr("x",-height/2)
        .attr("y",20)
        .attr("text-anchor","middle")
        .text("Protein Supply (g/capita/day)");

    svg.append("line")
        .attr("x1", x(avgFat))
        .attr("x2", x(avgFat))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "5,5");

    svg.append("text")
        .attr("x", x(avgFat))
        .attr("y", margin.top - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#555")
        .attr("font-weight", 600)
        .text("Average Fat");

    svg.append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(avgProtein))
        .attr("y2", y(avgProtein))
        .attr("stroke", "#999")
        .attr("stroke-dasharray", "5,5");

    svg.append("text")
        .attr("x", margin.left + 5)
        .attr("y", y(avgProtein) - 5)
        .attr("font-size", 11)
        .attr("fill", "#666")
        .attr("font-weight", 600)
        .text("Average Protein");

    svg.append("text")
        .attr("x", margin.left + 10)
        .attr("y", margin.top + 5)
        .attr("font-size", 12)
        .attr("font-weight", 600)
        .attr("fill", "#4CAF50")
        .text("Protein-Rich");

    svg.append("text")
        .attr("x", x(avgFat)+10)
        .attr("y", margin.top+5)
        .attr("font-size",12)
        .attr("font-weight","600")
        .attr("fill","#FFC107")
        .text("High Intake")

    svg.append("text")
        .attr("x", margin.left+10)
        .attr("y", y(avgProtein)+15)
        .attr("font-size",12)
        .attr("font-weight","600")
        .attr("fill","#42A5F5")
        .text("Lower Intake")
    
    svg.append("text")
        .attr("x", x(avgFat)+110)
        .attr("y", y(avgProtein)+15)
        .attr("font-size",12)
        .attr("font-weight","600")
        .attr("fill","#EF5350")
        .text("Fat-Dominant")

    const r = d3.scaleSqrt()
        .domain([
            d3.min(scatter, d => d.population),
            d3.max(scatter, d => d.population)
        ])
        .range([4, 22]);

    svg.selectAll("circle")
        .data(scatter)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.fat))
        .attr("cy", d => y(d.protein))
        .attr("r", d => {
            if (d.country === selectedCountry)
                return r(d.population)+4;
            return r(d.population);
        })
        .attr("fill", d => {
            if (d.country === selectedCountry) {
                return "#8E44AD"
            }
            if (d.protein >= avgProtein && d.fat < avgFat)
                return "#4CAF50";
            if (d.protein >= avgProtein && d.fat >= avgFat)
                return "#FFC107";  
            if (d.protein < avgProtein && d.fat < avgFat)
                return "#42A5F5";
            return "#EF5350";   
        })
        .attr("opacity", 0.7)
        .attr("stroke", d => d.country === selectedCountry ? "#000" : "#ffffff")
        .attr("stroke-width", d => d.country === selectedCountry ? 2.5 : 1)

        .on("mouseover", function(event, d){
            let profile = "";
            let profileColor = "";
            if (d.protein >= avgProtein && d.fat < avgFat) {
                profile = "Protein-Rich";
                profileColor = "#4CAF50";
            }
            else if (d.protein >= avgProtein && d.fat >= avgFat) {
                profile = "High Intake";
                profileColor = "#FFC107";
            }
            else if (d.protein < avgProtein && d.fat < avgFat) {
                profile = "Lower Intake";
                profileColor = "#42A5F5";
            }
            else {
                profile = "Fat-Dominant";
                profileColor = "#EF5350"
            }

            const proteinDiff = ((d.protein - avgProtein) / avgProtein) * 100;
            const fatDiff = ((d.fat - avgFat) / avgFat) * 100;

            const proteinStatus = proteinDiff >= 0 ? "Above Average" : "Below Average";
            const fatStatus = fatDiff >= 0 ? "Above Average" : "Below Average";

            const proteinArrow = proteinDiff >= 0 ? "▲" : "▼";
            const fatArrow = fatDiff >= 0 ? "▲" : "▼";

            const proteinColor = proteinDiff >= 0 ? "#2e7d32" : "#d32f2f";
            const fatColor = fatDiff >= 0 ? "#2e7d32" : "#d32f2f";

        d3.select("#tooltip")
        .style("opacity",1)
        .html(`
            <div class="tooltip-title">
                ${d.country}
            </div>

            <div class="tooltip-badge"
                style="background:${profileColor};">
                ${profile}
            </div>

            <div class="tooltip-section">

                <div class="tooltip-label">
                    Protein Supply
                </div>

                <div class="tooltip-value">
                    ${d.protein.toFixed(1)} g/day
                </div>

                <div class="tooltip-diff"
                    style="color:${proteinColor}">
                    ${proteinArrow}
                    ${Math.abs(proteinDiff).toFixed(1)}%
                    ${proteinStatus.toLowerCase()}
                </div>

            </div>

            <hr>

            <div class="tooltip-section">

                <div class="tooltip-label">
                    Fat Supply
                </div>

                <div class="tooltip-value">
                    ${d.fat.toFixed(1)} g/day
                </div>

                <div class="tooltip-diff"
                    style="color:${fatColor}">
                    ${fatArrow}
                    ${Math.abs(fatDiff).toFixed(1)}%
                    ${fatStatus.toLowerCase()}
                </div>

            </div>

            <hr>

            <div class="tooltip-section">

                <div class="tooltip-label">
                    Population
                </div>

                <div class="tooltip-value">
                    ${(d.population/1000).toFixed(1)} Million
                </div>

            </div>
        `);
        })

        .on("mousemove", function(event){
            d3.select("#tooltip")
                .style("left",(event.pageX+15)+"px")
                .style("top",(event.pageY-20)+"px");
        })

        .on("mouseout", function(){
            d3.select("#tooltip")
                .style("opacity",0);
        });

    const selected = scatter.filter(d => d.country === selectedCountry);

    svg.selectAll(".labelBox")
        .data(selected)
        .enter()
        .append("rect")
        .attr("x", d => x(d.fat) - 45)
        .attr("y", d => y(d.protein) - r(d.population) - 34)
        .attr("width", d => d.country.length * 6.5 + 18)
        .attr("x", d => x(d.fat) - (d.country.length * 6.5 + 18) / 2)
        .attr("height", 18)
        .attr("rx", 4)
        .attr("fill", "white")
        .attr("stroke", "#ccc")
        .attr("opacity", 0.95);

    svg.selectAll(".countryLabel")
        .data(selected)
        .enter()
        .append("text")
        .attr("x", d => x(d.fat))
        .attr("y", d => y(d.protein) - r(d.population) - 21)
        .attr("text-anchor","middle")
        .attr("font-size",12)
        .attr("font-weight","600")
        .text(d => d.country);

    svg.selectAll(".leaderLine")
        .data(scatter.filter(d => d.country === selectedCountry))
        .enter()
        .append("line")
        .attr("x1", d => x(d.fat))
        .attr("y1", d => y(d.protein) - r(d.population))
        .attr("x2", d => x(d.fat))
        .attr("y2", d => y(d.protein) - r(d.population) - 16)
        .attr("stroke","#333")
        .attr("stroke-width",1.2)
        .attr("stroke-dasharray","3,2");

    const legend = svg.append("g")
        .attr("transform", "translate(335, 185)");

    legend.append("rect")
        .attr("x",-15)
        .attr("y",-15)
        .attr("width",130)
        .attr("height",60)
        .attr("rx",10)
        .attr("fill","white")
        .attr("stroke","#cfcfcf")
        .attr("stroke-width",1.5)
        .attr("fill","#ffffff")
        .attr("opacity",0.95);

    legend.append("text")
        .attr("x", 0)
        .attr("y", 10)
        .attr("font-size", 12)
        .attr("font-weight", "700")
        .attr("fill", "#333")
        .text("Nutrition Profile");

    const item = legend.selectAll("g")
        .data(legendData)
        .enter()
        .append("g")
        .attr("transform",(d,i)=>`translate(0,${25+i*18})`);

    item.append("circle")
        .attr("r",6)
        .attr("fill",d=>d.color)
        .attr("stroke","#555");

    item.append("text")
        .attr("x",15)
        .attr("y",4)
        .style("font-size","11px")
        .text(d => d.label);

    svg.selectAll("circle")
        .filter(d => d.country === selectedCountry)
        .raise();

    svg.selectAll(".leaderLine").raise();
    svg.selectAll(".labelBox").raise();
    svg.selectAll(".countryLabel").raise();
}