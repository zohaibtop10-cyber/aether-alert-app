export interface Location {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  disease?: string;
}

export interface AirQuality {
  pm10: number;
  pm25: number;
  o3: number;
  co: number;
  no2: number;
}

export interface CurrentConditions {
  source: 'NASA POWER' | 'Open-Meteo';
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  airQuality?: AirQuality;
  dailyForecast: Forecast[];
  hourlyForecast: Forecast[];
}

export interface Forecast {
  time: string;
  temperature: number;
  rainChance: number;
  airQualityStatus: string;
}

export interface HistoricalDataPoint {
  date: string;
  temperature: number;
  rainfall: number;
  pressure: number;
}
