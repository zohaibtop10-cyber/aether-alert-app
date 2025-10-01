export interface Location {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export interface AirQuality {
  pm25: number;
  o3: number;
  co: number;
  no2: number;
}

export interface CurrentConditions {
  temperature: number;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  pressure: number;
  airQuality: AirQuality;
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
  pm25: number;
}
