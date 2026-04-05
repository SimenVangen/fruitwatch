import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../shared/styledcomponents";
import styled, { keyframes, css } from "styled-components";
import { useLanguage } from "../../context/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import api from "../../api/axios";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;
const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const SummaryContainer = styled.div`
  animation: ${fadeIn} 0.6s ease;
  padding: 1rem;
`;
const PageHeader = styled.div`margin-bottom: 2rem; text-align: center;`;
const PageTitle = styled.h1`
  color: #064E3B; font-size: 2.5rem; margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #064E3B 0%, #10B981 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
`;
const PageSubtitle = styled.p`color: #6B7280; font-size: 1.1rem;`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem; margin-bottom: 2rem;
`;
const StatCard = styled(Card)`
  animation: ${slideIn} 0.6s ease both;
  animation-delay: ${props => props.animationDelay || "0s"};
  border-left: 4px solid ${props => props.color};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover { transform: translateY(-5px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
`;
const StatValue = styled.div`
  font-size: 2.5rem; font-weight: bold;
  color: ${props => props.color}; margin: 0.5rem 0;
`;
const StatLabel = styled.div`
  color: #6B7280; font-size: 0.9rem;
  display: flex; align-items: center; gap: 0.5rem;
`;
const ProgressBar = styled.div`
  height: 6px; background: #F3F4F6;
  border-radius: 3px; margin: 0.5rem 0; overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%; background: ${props => props.color};
  border-radius: 3px; width: ${props => props.percentage}%;
  transition: width 1s ease;
`;
const ChartsGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;
const ChartCard = styled(Card)`animation: ${fadeIn} 0.8s ease;`;
const WeatherGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem; margin: 1rem 0;
`;
const WeatherCard = styled.div`
  padding: 1rem; border: 1px solid #E5E7EB; border-radius: 12px;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  text-align: center; transition: transform 0.2s ease;
  &:hover { transform: translateY(-2px); }
`;
const ForecastGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem; margin: 1rem 0;
`;
const ForecastCard = styled.div`
  padding: 1rem; border-radius: 12px; text-align: center;
  border: 2px solid ${props => props.isToday ? "#3B82F6" : "#E5E7EB"};
  background: ${props => props.isToday
    ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
    : "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"};
  color: ${props => props.isToday ? "white" : "inherit"};
`;
const ModalBackground = styled.div`
  position: fixed; inset: 0;
  backdrop-filter: blur(5px); background-color: rgba(0,0,0,0.4);
  display: flex; justify-content: center; align-items: center; z-index: 100;
`;
const ModalContent = styled.div`
  background: white; padding: 2rem; border-radius: 16px;
  width: 90%; max-width: 1000px; max-height: 90vh;
  overflow-y: auto; position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`;
const CloseButton = styled.button`
  position: absolute; top: 1rem; right: 1rem;
  font-size: 1.5rem; background: none; border: none;
  cursor: pointer; color: #6B7280;
  &:hover { color: #374151; }
`;
const AnimatedFarmCard = styled(Card)`
  animation: ${fadeIn} 0.6s ease both;
  animation-delay: ${props => props.animationDelay || "0s"};
  cursor: pointer; transition: all 0.3s ease;
  &:hover { transform: translateY(-5px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
`;

// ── Helpers ──────────────────────────────────────────────────
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

const formatShortDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

const translations = {
  en: {
    dashboardTitle: "Farm Analytics Dashboard",
    dashboardSubtitle: "Comprehensive overview of all your farm operations and performance metrics",
    totalFarms: "Total Farms", totalDetections: "Total Detections",
    totalRipeFruit: "Total Ripe Fruit", averageHarvestProgress: "Average Harvest Progress",
    loading: "Loading Farm Summary...", noData: "No Summary Data Available",
    noDataDescription: "Farm data will appear here once available",
    clickForDetails: "Click for detailed analytics →",
    detailedAnalytics: "Detailed Farm Analytics & Insights",
    ripeFruit: "Ripe Fruit", unripeFruit: "Unripe Fruit",
    harvestProgress: "Harvest Progress", currentWeather: "Current Weather",
    temperature: "Temperature", humidity: "Humidity",
    conditions: "Conditions", windSpeed: "Wind Speed",
    weatherHistory: "Weather History (7 Days)", harvestPrediction: "Harvest Prediction",
    fiveDayForecast: "5-Day Forecast", noWeatherData: "No current weather data available",
    noWeatherHistory: "No weather history data available",
    noPredictionData: "No prediction data available",
    lastUpdate: "Last Update", detections: "Detections", ripe: "Ripe", unripe: "Unripe",
  },
  zh: {
    dashboardTitle: "农场分析仪表板",
    dashboardSubtitle: "全面了解您所有农场的运营情况和性能指标",
    totalFarms: "农场总数", totalDetections: "总检测数",
    totalRipeFruit: "成熟水果总数", averageHarvestProgress: "平均收获进度",
    loading: "加载农场摘要中...", noData: "暂无摘要数据",
    noDataDescription: "农场数据将在可用后显示",
    clickForDetails: "点击查看详细分析 →",
    detailedAnalytics: "详细农场分析与洞察",
    ripeFruit: "成熟水果", unripeFruit: "未熟水果",
    harvestProgress: "收获进度", currentWeather: "当前天气",
    temperature: "温度", humidity: "湿度",
    conditions: "天气状况", windSpeed: "风速",
    weatherHistory: "天气历史 (7天)", harvestPrediction: "收获预测",
    fiveDayForecast: "5天预报", noWeatherData: "暂无当前天气数据",
    noWeatherHistory: "暂无天气历史数据",
    noPredictionData: "暂无预测数据",
    lastUpdate: "最后更新", detections: "检测数", ripe: "成熟", unripe: "未熟",
  },
};

export default function SummaryPage({ token }) {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [weatherMetric, setWeatherMetric] = useState("temperature");
  const { language } = useLanguage();

  const t = useCallback((key) => translations[language]?.[key] || key, [language]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get("/summary")
      .then(res => setSummaryData(res.data || []))
      .catch(() => setSummaryData([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <SummaryContainer>
      <Card style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <h3>{t("loading")}</h3>
      </Card>
    </SummaryContainer>
  );

  if (!summaryData.length) return (
    <SummaryContainer>
      <Card style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
        <h3>{t("noData")}</h3>
        <p style={{ color: "#6B7280" }}>{t("noDataDescription")}</p>
      </Card>
    </SummaryContainer>
  );

  const totalFarms = summaryData.length;
  const totalDetections = summaryData.reduce((s, f) => s + (f.total_detections || 0), 0);
  const totalRipe = summaryData.reduce((s, f) => s + (f.total_ripe || 0), 0);
  const avgHarvestPct = summaryData.reduce((s, f) => s + (f.harvested_pct || 0), 0) / totalFarms;

  // Format prediction history dates for chart
  const formatPredictionHistory = (history) =>
    (history || []).map(h => ({ ...h, date: formatShortDate(h.date) }));

  const renderModal = () => {
    if (!selectedFarm) return null;
    const weather = selectedFarm.current_weather || {};
    const hasWeather = weather.temperature !== undefined && !weather.error;

    return (
      <ModalBackground onClick={() => setSelectedFarm(null)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <CloseButton onClick={() => setSelectedFarm(null)}>×</CloseButton>

          <PageHeader style={{ textAlign: "left", marginBottom: "2rem" }}>
            <PageTitle style={{ fontSize: "2rem" }}>🌾 {selectedFarm.name}</PageTitle>
            <PageSubtitle>{t("detailedAnalytics")}</PageSubtitle>
          </PageHeader>

          <StatsGrid>
            {[
              { label: `🔍 ${t("totalDetections")}`, value: selectedFarm.total_detections, color: "#3B82F6" },
              { label: `🍎 ${t("ripeFruit")}`, value: selectedFarm.total_ripe, color: "#10B981" },
              { label: `🍏 ${t("unripeFruit")}`, value: selectedFarm.total_unripe, color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <StatCard key={label} color={color}>
                <StatLabel>{label}</StatLabel>
                <StatValue color={color}>{value}</StatValue>
              </StatCard>
            ))}
            <StatCard color="#8B5CF6">
              <StatLabel>📈 {t("harvestProgress")}</StatLabel>
              <StatValue color="#8B5CF6">{selectedFarm.harvested_pct?.toFixed(1) || 0}%</StatValue>
              <ProgressBar><ProgressFill percentage={selectedFarm.harvested_pct || 0} color="#8B5CF6" /></ProgressBar>
            </StatCard>
          </StatsGrid>

          {/* Current Weather — uses actual field names: temperature, humidity, weather, wind_speed */}
          <ChartCard style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#1F2937", marginBottom: "1rem" }}>🌤️ {t("currentWeather")}</h3>
            {hasWeather ? (
              <WeatherGrid>
                <WeatherCard>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌡️</div>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{Math.round(weather.temperature)}°C</div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("temperature")}</div>
                </WeatherCard>
                <WeatherCard>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💧</div>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{weather.humidity}%</div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("humidity")}</div>
                </WeatherCard>
                <WeatherCard>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{getWeatherEmoji(weather.weather)}</div>
                  <div style={{ fontWeight: "bold", fontSize: "1rem", textTransform: "capitalize" }}>
                    {weather.weather || "—"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("conditions")}</div>
                </WeatherCard>
                <WeatherCard>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💨</div>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{weather.wind_speed} m/s</div>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("windSpeed")}</div>
                </WeatherCard>
              </WeatherGrid>
            ) : (
              <p style={{ color: "#6B7280", textAlign: "center", padding: "2rem" }}>{t("noWeatherData")}</p>
            )}
          </ChartCard>

          <ChartsGrid>
            {/* Weather History */}
            <ChartCard>
              <h3 style={{ color: "#1F2937", marginBottom: "1rem" }}>📅 {t("weatherHistory")}</h3>
              {selectedFarm.weather_history?.length > 0 ? (
                <>
                  <select
                    value={weatherMetric}
                    onChange={e => setWeatherMetric(e.target.value)}
                    style={{ marginBottom: "1rem", padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px" }}
                  >
                    <option value="temperature">{t("temperature")}</option>
                    <option value="humidity">{t("humidity")}</option>
                  </select>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={selectedFarm.weather_history}>
                      <XAxis dataKey="date" tickFormatter={formatShortDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatShortDate} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={weatherMetric}
                        stroke={weatherMetric === "temperature" ? "#ff7300" : "#0088fe"}
                        strokeWidth={3}
                        dot={{ fill: "#1F2937", r: 4 }}
                        name={t(weatherMetric)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p style={{ color: "#6B7280", textAlign: "center", padding: "2rem" }}>{t("noWeatherHistory")}</p>
              )}
            </ChartCard>

            {/* Harvest Prediction Chart */}
            <ChartCard>
              <h3 style={{ color: "#1F2937", marginBottom: "1rem" }}>📊 {t("harvestPrediction")}</h3>
              {selectedFarm.prediction_history?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={formatPredictionHistory(selectedFarm.prediction_history)}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ripe" fill="#10B981" name={t("ripeFruit")} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unripe" fill="#F59E0B" name={t("unripeFruit")} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: "#6B7280", textAlign: "center", padding: "2rem" }}>{t("noPredictionData")}</p>
              )}
            </ChartCard>
          </ChartsGrid>

          {/* 5-Day Forecast — uses actual field names: temp, date, weather */}
          {selectedFarm.weather_forecast?.length > 0 && (
            <ChartCard>
              <h3 style={{ color: "#1F2937", marginBottom: "1rem" }}>🌦️ {t("fiveDayForecast")}</h3>
              <ForecastGrid>
                {selectedFarm.weather_forecast.slice(0, 5).map((day, i) => (
                  <ForecastCard key={i} isToday={i === 0}>
                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                      {i === 0 ? t("today") : i === 1 ? t("tomorrow") : formatShortDate(day.date)}
                    </div>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
                      {getWeatherEmoji(day.weather)}
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      {day.temp !== undefined && day.temp !== null ? `${Math.round(day.temp)}°C` : "—"}
                    </div>
                    <div style={{ fontSize: "0.8rem", marginTop: "0.25rem", textTransform: "capitalize", opacity: 0.85 }}>
                      {day.weather || "—"}
                    </div>
                  </ForecastCard>
                ))}
              </ForecastGrid>
            </ChartCard>
          )}
        </ModalContent>
      </ModalBackground>
    );
  };

  return (
    <SummaryContainer>
      <PageHeader>
        <PageTitle>🌾 {t("dashboardTitle")}</PageTitle>
        <PageSubtitle>{t("dashboardSubtitle")}</PageSubtitle>
      </PageHeader>

      <StatsGrid>
        {[
          { label: `🏠 ${t("totalFarms")}`, value: totalFarms, color: "#3B82F6", delay: "0.1s" },
          { label: `🔍 ${t("totalDetections")}`, value: totalDetections, color: "#10B981", delay: "0.2s" },
          { label: `🍎 ${t("totalRipeFruit")}`, value: totalRipe, color: "#F59E0B", delay: "0.3s" },
        ].map(({ label, value, color, delay }) => (
          <StatCard key={label} color={color} animationDelay={delay}>
            <StatLabel>{label}</StatLabel>
            <StatValue color={color}>{value}</StatValue>
          </StatCard>
        ))}
        <StatCard color="#8B5CF6" animationDelay="0.4s">
          <StatLabel>📈 {t("averageHarvestProgress")}</StatLabel>
          <StatValue color="#8B5CF6">{avgHarvestPct.toFixed(1)}%</StatValue>
          <ProgressBar><ProgressFill percentage={avgHarvestPct} color="#8B5CF6" /></ProgressBar>
        </StatCard>
      </StatsGrid>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {summaryData.map((farm, i) => {
          const weather = farm.current_weather || {};
          const hasWeather = weather.temperature !== undefined && !weather.error;
          return (
            <AnimatedFarmCard key={farm.id} onClick={() => setSelectedFarm(farm)} animationDelay={`${0.1 + i * 0.1}s`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <h3 style={{ color: "#064E3B", margin: 0 }}>🌾 {farm.name}</h3>
                <div style={{ background: "#10B981", color: "white", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
                  {farm.harvested_pct?.toFixed(1) || 0}%
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {[
                  { label: `🔍 ${t("detections")}`, value: farm.total_detections, color: "#1F2937" },
                  { label: `🍎 ${t("ripe")}`, value: farm.total_ripe, color: "#10B981" },
                  { label: `🍏 ${t("unripe")}`, value: farm.total_unripe, color: "#F59E0B" },
                  { label: `📅 ${t("lastUpdate")}`, value: farm.last_update ? new Date(farm.last_update).toLocaleDateString() : "N/A", color: "#6B7280", small: true },
                ].map(({ label, value, color, small }) => (
                  <div key={label}>
                    <StatLabel>{label}</StatLabel>
                    <div style={{ fontWeight: "bold", color, fontSize: small ? "0.8rem" : "inherit" }}>{value}</div>
                  </div>
                ))}
              </div>

              {hasWeather && (
                <div style={{ padding: "0.75rem", background: "linear-gradient(135deg, #F0F9FF, #E0F2FE)", borderRadius: "8px", border: "1px solid #BAE6FD" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {getWeatherEmoji(weather.weather)}
                      <span style={{ fontWeight: "bold" }}>{Math.round(weather.temperature)}°C</span>
                    </span>
                    <span style={{ color: "#6B7280", textTransform: "capitalize" }}>{weather.weather || "—"}</span>
                  </div>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #E5E7EB", color: "#3B82F6", fontWeight: "600", fontSize: "0.9rem" }}>
                {t("clickForDetails")}
              </div>
            </AnimatedFarmCard>
          );
        })}
      </div>

      {renderModal()}
    </SummaryContainer>
  );
}
