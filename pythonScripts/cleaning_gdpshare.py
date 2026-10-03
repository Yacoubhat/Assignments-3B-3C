import pandas as pd

data = pd.read_csv('data/public-health-expenditure-share-gdp.csv')

d = [data['Country'].unique()]
print(d)


filtered_date = data[data['Year'] >= 2000]
print(filtered_date)

filename = "data/cleaned-health-expenditurr-share-gdp.csv"
filtered_date.to_csv(filename, index=False)






