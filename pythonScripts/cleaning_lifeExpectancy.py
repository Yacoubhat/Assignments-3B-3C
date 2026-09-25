import pandas as pd

data = pd.read_csv("data/oecd_life_expectancy_data.csv")

columns_to_keep = [
    'Reference area',
    'Age',
    'Sex',
    'TIME_PERIOD',
    'OBS_VALUE'
]

new_data = data[columns_to_keep].copy()

new_data.columns = ['Country', 'Age', 'Sex', 'Year', 'Life Expectancy']

new_data.sort_values(by=['Country', 'Year'], inplace=True)

data_Total = new_data[new_data['Sex'] == 'Total'].copy()
data_Female = new_data[new_data['Sex'] == 'Female'].copy()
data_Male = new_data[new_data['Sex'] == 'Male'].copy()  

filename_Total = "data/cleaned_life_expectancy_total.csv"
data_Total.to_csv(filename_Total, index=False)
filename_Female = "data/cleaned_life_expectancy_female.csv"
data_Female.to_csv(filename_Female, index=False)
filename_Male = "data/cleaned_life_expectancy_male.csv"
data_Male.to_csv(filename_Male, index=False)

print("Total Life Expectancy Data:")
print(data_Total.head())
print("\nFemale Life Expectancy Data:")
print(data_Female.head())
print("\nMale Life Expectancy Data:")
print(data_Male.head())