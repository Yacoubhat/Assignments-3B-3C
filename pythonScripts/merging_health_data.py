import pandas as pd
import numpy as np  

#import the cleaned data files
healthcare_spending_data = pd.read_csv("data/cleaned_health_expenditure_ppp.csv") 
life_expectancy_data = pd.read_csv("data/cleaned_life_expectancy_total.csv")
female_life_expectancy_data = pd.read_csv("data/cleaned_life_expectancy_female.csv")
male_life_expectancy_data = pd.read_csv("data/cleaned_life_expectancy_male.csv")

#rename the columns for female and male life expectancy dataframes
def rename_columns(female_life_expectancy_df, male_life_expectancy_df):
    female_life_expectancy_df.rename(columns={'Life Expectancy': 'Female'}, inplace=True)
    male_life_expectancy_df.rename(columns={'Life Expectancy': 'Male'}, inplace=True)
    return female_life_expectancy_df, male_life_expectancy_df

#merge the dataframes on Country and Year columns
target_columns = ["Country", "Year"]
def merge_health_data(life_expectancy_df, healthcare_spending_df, female, male):
    merged_data = pd.merge(life_expectancy_df, healthcare_spending_df, on=target_columns, how='inner')
    merged_data = pd.merge(merged_data, female, on=target_columns, how='inner')
    merged_data = pd.merge(merged_data, male, on=target_columns, how='inner')
    merged_data.dropna(inplace=True) #drop rows with missing values
    return merged_data




def main():
    female_life_expectancy, male_life_expectancy = rename_columns(female_life_expectancy_data, male_life_expectancy_data)
    merged_total_data = merge_health_data(life_expectancy_data, healthcare_spending_data, female_life_expectancy, male_life_expectancy)   
    
    #remove unnecessary columns from the merged dataframe
    drop_columns = ['Age_x', 'Sex_x', 'Age_y', 'Sex_y', 'Age', 'Sex']
    merged_total_data.drop(columns=drop_columns, inplace=True) #drop unnecessary columns from the merged dataframe
    
    #reorder the columns in the merged dataframe
    ordered_merge =  merged_total_data[['Country', 'Country Code', 'Year', 'Health Expenditure Share of ppp per capita', 'Life Expectancy', 'Female', 'Male']]
    
    #save the merged dataframe to a CSV file
    filename_merged = "data/health_data_merged.csv"
    ordered_merge.to_csv(filename_merged, index=False)
    print("Merged Health Data:")
    print(merged_total_data.head())
if __name__ == "__main__":
    main()