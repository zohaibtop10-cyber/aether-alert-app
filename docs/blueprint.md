# **App Name**: Aether Alert

## Core Features:

- Realtime Environment Monitoring: Fetch and display realtime data for temperature, humidity, air quality (PM2.5, O₃, CO, NO₂), rain chances, and precipitation from NASA APIs. Include a placeholder for noise pollution data with an information note.
- Personalized Health Alerts: Allow users to input specific diseases. Use the environmental data as a tool to assess if current/future conditions worsen their condition and generate personalized alerts (e.g., 'Asthma Alert: High PM2.5 today, avoid outdoor exercise'). Provide general alerts if no disease is specified.
- Daily Forecasts and Predictions: Provide rain predictions, air quality forecasts, and temperature/climate forecasts based on data from NASA GPM, GEOS-CF, and POWER APIs.
- Location Search: Enable users to search by location (lat/lon or city) to retrieve relevant environmental data from NASA APIs.
- Historical Data Visualization: Display charts and graphs showing historical trends (last 7/30 days) of air pollution, rainfall, and temperature data.
- User Preferences Storage: Implement local storage to store user preferences (disease, location, dark/light mode) for a personalized experience.
- Dark/Light Mode Toggle: Implement a dark/light mode toggle to improve UI accessibility for the users.

## Style Guidelines:

- Primary color: Deep sky blue (#41a7ff) evokes a sense of trust, clarity, and the sky.
- Background color: Light gray (#f0f2f5) for a clean, modern feel, appropriate to a light scheme. Note: a future developer could easily substitute a near-black for the dark scheme.
- Accent color: Vivid blue (#0077cc) for interactive elements, calls to action, and highlights, giving a crisp, technical feel.
- Font: 'Inter', a sans-serif font with a modern, objective look, for both headlines and body text.
- Use clear, intuitive icons to represent different environmental factors (air quality, weather, rain) and health alerts.
- Design a responsive layout that adapts to different screen sizes, ensuring a seamless experience on both mobile and desktop devices. Use simple terms for environmental conditions (e.g., 'Clean Air,' 'High Pollution Risk').
- Incorporate subtle animations for data updates and transitions to provide visual feedback without overwhelming the user.