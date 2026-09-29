import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


d3.csv("data/cleaned_health_expenditure.csv", function(data) {
    console.log(data);
});
