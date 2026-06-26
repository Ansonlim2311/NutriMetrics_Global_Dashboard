function loadData(){

    Promise.all([
        d3.json("map/world-topo.json"),
        d3.csv("Data/FoodBalanceSheets_Cleaned.csv")
    ])
    .then(([world, foodData])=>{

        initMap(world, foodData);

        initWaterfall(foodData);        
    });

}

loadData();