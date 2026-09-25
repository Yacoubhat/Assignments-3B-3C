import requests 
import pandas as pd
import io

api_url = "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_SHA@DF_SHA,1.1/AUS+AUT+BEL+CAN+CHL+COL+CRI+CZE+DNK+EST+FIN+FRA+DEU+GRC+HUN+ISL+IRL+ISR+ITA+JPN+KOR+LVA+LTU+LUX+MEX+NLD+NZL+NOR+POL+PRT+SVK+SVN+ESP+SWE+CHE+TUR+GBR+USA+ALB+ARG+BIH+BRA+BGR+CHN+HRV+CYP+GEO+IND+IDN+LIE+MLT+MDA+MNE+MKD+PER+ROU+SRB+ZAF+THA+UKR.A.EXP_HEALTH.USD_PPP_PS._T.._T.._T...V?startPeriod=2000&endPeriod=2025&dimensionAtObservation=AllDimensions"

if "format=" not in api_url.lower():
    sep = "&" if "?" in api_url else "?"
    api_url += f"{sep}format=csvfilewithlabels"
    
print(f"Fetching data from: {api_url}")

response = requests.get(api_url)

if response.status_code == 200:
    
    df = pd.read_csv(io.StringIO(response.text))
    
    filename = "data/oecd_health_expenditure_data.csv"
    df.to_csv(filename, index=False)
    
    print("Data fetched successfully.", df.shape)
    
    print(df.head(10))
    
else:
    print(f"Failed to fetch data. Status code: {response.status_code}")
    print("Response message:", response.text)