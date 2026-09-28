import pandas as pd
import requests
import io

oecdApi_url = "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HEALTH_STAT@DF_LE,1.1/AUS+AUT+BEL+CAN+CHL+COL+CRI+CZE+DNK+EST+FIN+FRA+DEU+GRC+HUN+ISL+IRL+ISR+ITA+JPN+KOR+LVA+LTU+LUX+MEX+NLD+NZL+NOR+POL+PRT+SVK+SVN+ESP+SWE+CHE+TUR+GBR+USA+ARG+BRA+BGR+CHN+HRV+IND+IDN+PER+ROU+RUS+ZAF+THA+UKR.A.LFEXPDFM+LFEXPDMF+LFEXP..Y0._T+F+M.......?startPeriod=2000&endPeriod=2025&dimensionAtObservation=AllDimensions"

if "format=" not in oecdApi_url.lower():
    separator = "&" if "?" in oecdApi_url else "?"
    oecdApi_url += f"{separator}format=csvfilewithlabels"
    
print(f"Fetching data from OECD API: {oecdApi_url}")

response = requests.get(oecdApi_url)

if response.status_code == 200:
    
    data = pd.read_csv(io.StringIO(response.text))
    
    filename = "data/oecd_life_expectancy_data.csv"
    data.to_csv(filename, index=False)
    print(f"Data saved to {filename}")
    
    print(f"Successfully fetched data from OECD API and saved to {filename}.")
    print(f"Rows, Columns: {data.shape}")
    
else:
    print(f"Failed to fetch data from OECD API. Status code: {response.status_code}")
    print(f"Response content: {response.content.decode('utf-8')}")