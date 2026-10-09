import pandas as pd

df = pd.read_csv("data/health_data_merged.csv")

CountryCodes = [df['Country Code'].unique()]
print(CountryCodes)

CountryYears = [df['Year'].unique()]
print(CountryYears)
