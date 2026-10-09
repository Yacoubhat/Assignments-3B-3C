import pandas as pd
import matplotlib.pyplot as plt

# 1. Load your newly merged dataset
df = pd.read_csv("data/health_data_merged.csv")

# 2. Filter for a few specific countries (plotting all countries creates a messy "spaghetti" chart)
countries_to_plot = ['Australia', 'Argentina', 'United States'] 
filtered_df = df[df['Country'].isin(countries_to_plot)]

# 3. Set up the canvas
plt.figure(figsize=(10, 6))

# 4. Loop through each country to plot its historical trajectory
for country in countries_to_plot:
    # Isolate the country's data and ensure it is sorted chronologically
    country_data = filtered_df[filtered_df['Country'] == country].sort_values('Year')
    
    # Draw the continuous line tracing the historical path
    plt.plot(
        country_data['Health Expenditure Share of ppp per capita'], 
        country_data['Life Expectancy'], 
        marker='o',       # Adds a dot for each year
        linestyle='-',    # Connects the dots sequentially
        linewidth=2, 
        label=country
    )
    
    # Annotate the start and end years to show the direction of time
    start = country_data.iloc[0]
    end = country_data.iloc[-1]
    plt.text(start['Health Expenditure Share of ppp per capita'], start['Life Expectancy'], f" {int(start['Year'])}", fontsize=9)
    plt.text(end['Health Expenditure Share of ppp per capita'], end['Life Expectancy'], f" {int(end['Year'])}", fontsize=9, fontweight='bold')

# 5. Add titles and layout formatting
plt.title('Connected Scatter Plot: Healthcare Spending vs Life Expectancy')
plt.xlabel('Health Expenditure Share of ppp per capita')
plt.ylabel('Life Expectancy (Years)')
plt.legend(title="Country")
plt.grid(True, linestyle='--', alpha=0.6)

# Show the final visualization
plt.show()