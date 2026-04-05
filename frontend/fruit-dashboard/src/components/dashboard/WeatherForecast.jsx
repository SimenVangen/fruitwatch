import React from "react";
import { Card } from "../shared/styledcomponents";
import styled, { keyframes, css } from "styled-components";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const ForecastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ForecastCard = styled.div`
  text-align: center;
  padding: 1.25rem 1rem;
  background: ${props => props.isToday
    ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
    : "white"};
  border: ${props => props.isToday ? "2px solid #3B82F6" : "1px solid #e5e7eb"};
  border-radius: 12px;
  color: ${props => props.isToday ? "white" : "inherit"};
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.6s ease both;
  animation-delay: ${props => props.index * 0.1}s;
  box-shadow: ${props => props.isToday ? "0 8px 25px rgba(59,130,246,0.3)" : "0 2px 8px rgba(0,0,0,0.05)"};

  ${props => !props.isToday && css`
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      border-color: #10B981;
    }
  `}
`;

const TodayBadge = styled.div`
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 0.5rem;
  animation: ${pulse} 2s infinite;
`;

const WeatherEmoji = styled.div`
  font-size: 2.2rem;
  margin-bottom: 0.4rem;
`;

const Temp = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
  margin: 0.4rem 0;
  color: ${props => props.isToday ? "white" : "#3B82F6"};
`;

const Detail = styled.div`
  font-size: 0.78rem;
  margin: 0.2rem 0;
  color: ${props => props.isToday ? "rgba(255,255,255,0.85)" : "#6B7280"};
`;

const getWeatherEmoji = (weather) => {
  if (!weather) return "🌤️";
  const w = weather.toLowerCase();
  if (w.includes("snow")) return "❄️";
  if (w.includes("thunder")) return "⛈️";
  if (w.includes("rain") || w.includes("drizzle")) return "🌧️";
  if (w.includes("cloud")) return "☁️";
  if (w.includes("mist") || w.includes("fog")) return "🌫️";
  if (w.includes("clear") || w.includes("sun")) return "☀️";
  return "🌤️";
};

const formatDate = (dateString, index) => {
  if (index === 0) return "Today";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
};

export default function WeatherForecast({ summaryData, selectedFarmId }) {
  const farmsToShow = selectedFarmId
    ? summaryData.filter(f => f.id === selectedFarmId)
    : summaryData;

  if (!farmsToShow.length) {
    return <Card style={{ textAlign: "center", color: "#6B7280" }}>No weather data available</Card>;
  }

  return (
    <div>
      {farmsToShow.map(farm => (
        <div key={farm.id} style={{ marginBottom: "1.5rem" }}>
          {!selectedFarmId && (
            <h4 style={{ color: "#1F2937", marginBottom: "1rem", fontSize: "1rem" }}>
              🌤️ {farm.name}
            </h4>
          )}

          {/* Current weather */}
          {farm.current_weather && !farm.current_weather.error && (
            <div style={{
              background: "linear-gradient(135deg, #10B981, #064E3B)",
              color: "white",
              borderRadius: "12px",
              padding: "1rem 1.5rem",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}>
              <div>
                <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: "0.25rem" }}>Current Weather</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {farm.current_weather.temperature !== undefined
                    ? `${Math.round(farm.current_weather.temperature)}°C`
                    : "—"}
                </div>
                <div style={{ fontSize: "0.9rem", opacity: 0.9, textTransform: "capitalize" }}>
                  {farm.current_weather.weather || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {farm.current_weather.humidity !== undefined && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem" }}>💧</div>
                    <div style={{ fontSize: "0.85rem" }}>{farm.current_weather.humidity}%</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Humidity</div>
                  </div>
                )}
                {farm.current_weather.wind_speed !== undefined && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem" }}>💨</div>
                    <div style={{ fontSize: "0.85rem" }}>{farm.current_weather.wind_speed} m/s</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Wind</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forecast */}
          {farm.weather_forecast?.length > 0 ? (
            <ForecastGrid>
              {farm.weather_forecast.map((day, index) => (
                <ForecastCard key={index} isToday={index === 0} index={index}>
                  {index === 0 && <TodayBadge>Today</TodayBadge>}

                  <WeatherEmoji>{getWeatherEmoji(day.weather)}</WeatherEmoji>

                  <div style={{
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    marginBottom: "0.4rem",
                    color: index === 0 ? "white" : "#1F2937"
                  }}>
                    {formatDate(day.date, index)}
                  </div>

                  <Temp isToday={index === 0}>
                    {day.temp !== undefined && day.temp !== null
                      ? `${Math.round(day.temp)}°C`
                      : "—"}
                  </Temp>

                  <Detail isToday={index === 0} style={{ textTransform: "capitalize" }}>
                    {day.weather || "—"}
                  </Detail>
                </ForecastCard>
              ))}
            </ForecastGrid>
          ) : (
            <div style={{ textAlign: "center", color: "#6B7280", padding: "1rem" }}>
              No forecast available
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
