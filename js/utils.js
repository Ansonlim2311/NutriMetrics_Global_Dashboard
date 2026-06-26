let selectedYear = "Y2023";
let selectedMetric = "food";
let selectedCountry = null;
let tooltipLocked = false;

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

function buildMetricMap(rows, year){
    const map = {};

    rows.forEach(d => {
        map[d.Area] = +d[year];
    });

    return map;
}

function getWorldValue(metricRows, year){
    const worldRow = metricRows.find(d => d.Area === "World");
    return +worldRow[year];
}

function getLatestAvailable(row){
    const years = [
        "Y2023","Y2022","Y2021","Y2020",
        "Y2019","Y2018","Y2017","Y2016",
        "Y2015","Y2014","Y2013","Y2012",
        "Y2011","Y2010"
    ];

    for(const year of years){
        const value = +row[year];
        if(!isNaN(value) && value > 0){
            return {
                year: year,
                value: value
            };
        }
    }
    return null;
}

function formatTonnes(value){
    if(value >= 1000000){
        return (value/1000000).toFixed(2) + " B t";
    }
    if(value >= 1000){
        return (value/1000).toFixed(2) + " M t";
    }
    return value.toLocaleString() + " K t";
}