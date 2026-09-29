import pandas as pd
import numpy as np  

healthcare_spending_data = pd.read_csv("data/cleaned_health_expenditure_ppp.csv")
life_expectancy_data = pd.read_csv("data/cleaned_life_expectancy_total.csv")
female_life_expectancy_data = pd.read_csv("data/cleaned_life_expectancy_female.csv")
male_life_expectancy_data = pd.read_csv("data/cleaned_life_expectancy_male.csv")


def rename_columns(female_life_expectancy_df, male_life_expectancy_df):
    female_life_expectancy_df.rename(columns={'Life Expectancy': 'Female'}, inplace=True)
    male_life_expectancy_df.rename(columns={'Life Expectancy': 'Male'}, inplace=True)
    return female_life_expectancy_df, male_life_expectancy_df

target_columns = ["Country", "Year"]
def merge_health_data(life_expectancy_df, healthcare_spending_df, female, male):
    merged_data = pd.merge(life_expectancy_df, healthcare_spending_df, on=target_columns, how='inner')
    merged_data = pd.merge(merged_data, female, on=target_columns, how='inner')
    merged_data = pd.merge(merged_data, male, on=target_columns, how='inner')
    merged_data.dropna(inplace=True)
    return merged_data




def main():
    female_life_expectancy, male_life_expectancy = rename_columns(female_life_expectancy_data, male_life_expectancy_data)
    merged_total_data = merge_health_data(life_expectancy_data, healthcare_spending_data, female_life_expectancy, male_life_expectancy)   
    
    drop_columns = ['Age_x', 'Sex_x', 'Age_y', 'Sex_y', 'Age', 'Sex']
    merged_total_data.drop(columns=drop_columns, inplace=True)
    
    ordered_merge =  merged_total_data[['Country', 'Country Code', 'Year', 'Health Expenditure Share of ppp per capita', 'Life Expectancy', 'Female', 'Male']]
    
    filename_merged = "data/health_data_merged.csv"
    ordered_merge.to_csv(filename_merged, index=False)
    print("Merged Health Data:")
    print(merged_total_data.head())
if __name__ == "__main__":
    main()