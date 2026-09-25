import pandas as pd


data = pd.read_csv("data/health_expenditure_financing.csv")

columns_to_keep = [
    'REF_AREA',
    'Reference area',
    'TIME_PERIOD',
    'OBS_VALUE',
]

new_data = data[columns_to_keep].copy()
new_data.columns = ['Country Code', 'Country', 'Year', 'Health Expenditure Share of ppp per capita']

sorted_data = new_data.sort_values(by=['Country', 'Year'])

filename = "data/cleaned_health_expenditure_ppp.csv"

sorted_data.to_csv(filename, index=False)


print("Cleaned Health Expenditure Share of GDP Data:")
print(sorted_data.head())