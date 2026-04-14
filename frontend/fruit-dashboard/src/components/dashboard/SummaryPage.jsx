import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../shared/styledcomponents";
import styled, { keyframes } from "styled-components";
import { useLanguage } from "../../context/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import api from "../../api/axios";

const BASE_URL = "http://localhost:8000";

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const slideIn = keyframes`from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}`;

const SummaryContainer = styled.div`animation:${fadeIn} 0.6s ease;padding:1rem;`;
const PageHeader       = styled.div`margin-bottom:2rem;text-align:center;`;
const PageTitle        = styled.h1`
  color:#064E3B;font-size:2.5rem;margin-bottom:0.5rem;
  background:linear-gradient(135deg,#064E3B 0%,#10B981 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
`;
const PageSubtitle = styled.p`color:#6B7280;font-size:1.1rem;`;
const StatsGrid    = styled.div`
  display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:1.5rem;margin-bottom:2rem;
`;
const StatCard = styled(Card)`
  animation:${slideIn} 0.6s ease both;
  animation-delay:${p=>p.animationDelay||"0s"};
  border-left:4px solid ${p=>p.color};
  transition:transform 0.3s ease,box-shadow 0.3s ease;
  &:hover{transform:translateY(-5px);box-shadow:0 8px 30px rgba(0,0,0,0.12);}
`;
const StatValue = styled.div`font-size:2.5rem;font-weight:bold;color:${p=>p.color};margin:0.5rem 0;`;
const StatLabel = styled.div`color:#6B7280;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;`;
const ProgressBar  = styled.div`height:6px;background:#F3F4F6;border-radius:3px;margin:0.5rem 0;overflow:hidden;`;
const ProgressFill = styled.div`height:100%;background:${p=>p.color};border-radius:3px;width:${p=>p.percentage}%;transition:width 1s ease;`;
const ChartsGrid   = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem;
  @media(max-width:1024px){grid-template-columns:1fr;}
`;
const ChartCard    = styled(Card)`animation:${fadeIn} 0.8s ease;`;
const WeatherGrid  = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin:1rem 0;`;
const WeatherCard  = styled.div`
  padding:1rem;border:1px solid #E5E7EB;border-radius:12px;
  background:linear-gradient(135deg,#F8FAFC 0%,#F1F5F9 100%);
  text-align:center;transition:transform 0.2s ease;&:hover{transform:translateY(-2px);}
`;
const ForecastGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;margin:1rem 0;`;
const ForecastCard = styled.div`
  padding:1rem;border-radius:12px;text-align:center;
  border:2px solid ${p=>p.isToday?"#3B82F6":"#E5E7EB"};
  background:${p=>p.isToday?"linear-gradient(135deg,#3B82F6 0%,#1D4ED8 100%)":"linear-gradient(135deg,#F8FAFC 0%,#F1F5F9 100%)"};
  color:${p=>p.isToday?"white":"inherit"};
`;
const ModalBackground = styled.div`
  position:fixed;inset:0;backdrop-filter:blur(5px);
  background-color:rgba(0,0,0,0.4);display:flex;
  justify-content:center;align-items:center;z-index:100;
`;
const ModalContent = styled.div`
  background:white;padding:2rem;border-radius:16px;
  width:90%;max-width:1000px;max-height:90vh;
  overflow-y:auto;position:relative;
  box-shadow:0 20px 60px rgba(0,0,0,0.2);
`;
const CloseButton = styled.button`
  position:absolute;top:1rem;right:1rem;font-size:1.5rem;
  background:none;border:none;cursor:pointer;color:#6B7280;
  &:hover{color:#374151;}
`;
const AnimatedFarmCard = styled(Card)`
  animation:${fadeIn} 0.6s ease both;
  animation-delay:${p=>p.animationDelay||"0s"};
  cursor:pointer;transition:all 0.3s ease;
  &:hover{transform:translateY(-5px);box-shadow:0 8px 30px rgba(0,0,0,0.12);}
`;

// ── Scan Gallery styles ──────────────────────────────────────
const FolderRow = styled.div`
  border:1px solid #E5E7EB;border-radius:10px;
  margin-bottom:0.75rem;overflow:hidden;
`;
const FolderHeader = styled.button`
  width:100%;background:#F8FAFC;border:none;padding:0.85rem 1rem;
  display:flex;align-items:center;justify-content:space-between;
  cursor:pointer;font-size:0.95rem;font-weight:600;color:#1F2937;
  transition:background 0.15s;&:hover{background:#F1F5F9;}
`;
const FolderBody = styled.div`
  display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:0.75rem;padding:0.75rem;background:white;
`;
const ScanCard = styled.div`
  border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;
  transition:box-shadow 0.2s;&:hover{box-shadow:0 4px 12px rgba(0,0,0,0.1);}
`;
const ScanImg = styled.img`
  width:100%;height:130px;object-fit:cover;display:block;
  background:#F3F4F6;cursor:pointer;
`;
const ScanInfo = styled.div`padding:0.5rem 0.6rem;`;
const Tag = styled.span`
  display:inline-block;padding:0.15rem 0.5rem;border-radius:12px;
  font-size:0.7rem;font-weight:600;
  background:${p=>p.bg||"#F3F4F6"};color:${p=>p.color||"#374151"};
`;

// ── Lightbox ─────────────────────────────────────────────────
const Lightbox = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,0.85);
  display:flex;align-items:center;justify-content:center;z-index:200;
`;
const LightboxImg = styled.img`
  max-width:90vw;max-height:85vh;border-radius:8px;
  box-shadow:0 8px 40px rgba(0,0,0,0.6);
`;

// ── Helpers ──────────────────────────────────────────────────
const getWeatherEmoji = (w) => {
  if (!w) return "🌤️";
  const s = w.toLowerCase();
  if (s.includes("snow"))    return "❄️";
  if (s.includes("thunder")) return "⛈️";
  if (s.includes("rain")||s.includes("drizzle")) return "🌧️";
  if (s.includes("cloud"))   return "☁️";
  if (s.includes("mist")||s.includes("fog"))     return "🌫️";
  if (s.includes("clear")||s.includes("sun"))    return "☀️";
  return "🌤️";
};

const formatShortDate = (d) => {
  try { return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
  catch { return d; }
};

const formatFullDate = (d) => {
  try { return new Date(d).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}); }
  catch { return d; }
};

const formatTime = (d) => {
  try { return new Date(d).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}); }
  catch { return ""; }
};

const groupByDate = (detections) => {
  const groups = {};
  detections.forEach(d => {
    const key = new Date(d.timestamp).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  // Sort groups newest first
  return Object.entries(groups).sort(([a],[b]) => new Date(b) - new Date(a));
};

const imageUrl = (path) => {
  if (!path) return null;
  // New format: /uploads/lychee/originals/file.jpg
  if (path.startsWith("/uploads/")) return `${BASE_URL}${path}`;
  // Legacy: absolute path — extract just the filename
  const filename = path.split("/").pop();
  return `${BASE_URL}/uploads/${filename}`;
};

const translations = {
  en: {
    dashboardTitle:"Farm Analytics Dashboard",
    dashboardSubtitle:"Comprehensive overview of all your farm operations and performance metrics",
    totalFarms:"Total Farms",totalDetections:"Total Detections",
    totalRipeFruit:"Total Ripe Fruit",averageHarvestProgress:"Average Harvest Progress",
    loading:"Loading Farm Summary...",noData:"No Summary Data Available",
    noDataDescription:"Farm data will appear here once available",
    clickForDetails:"Click for detailed analytics →",
    detailedAnalytics:"Detailed Farm Analytics & Insights",
    ripeFruit:"Ripe Fruit",unripeFruit:"Unripe Fruit",
    harvestProgress:"Harvest Progress",currentWeather:"Current Weather",
    temperature:"Temperature",humidity:"Humidity",
    conditions:"Conditions",windSpeed:"Wind Speed",
    weatherHistory:"Weather History (7 Days)",harvestPrediction:"Harvest Prediction",
    fiveDayForecast:"5-Day Forecast",noWeatherData:"No current weather data available",
    noWeatherHistory:"No weather history data available",
    noPredictionData:"No prediction data available",
    lastUpdate:"Last Update",detections:"Detections",ripe:"Ripe",unripe:"Unripe",
    scanHistory:"Scan History",noScans:"No scans recorded yet.",
  },
  zh: {
    dashboardTitle:"农场分析仪表板",
    dashboardSubtitle:"全面了解您所有农场的运营情况和性能指标",
    totalFarms:"农场总数",totalDetections:"总检测数",
    totalRipeFruit:"成熟水果总数",averageHarvestProgress:"平均收获进度",
    loading:"加载农场摘要中...",noData:"暂无摘要数据",
    noDataDescription:"农场数据将在可用后显示",
    clickForDetails:"点击查看详细分析 →",
    detailedAnalytics:"详细农场分析与洞察",
    ripeFruit:"成熟水果",unripeFruit:"未熟水果",
    harvestProgress:"收获进度",currentWeather:"当前天气",
    temperature:"温度",humidity:"湿度",
    conditions:"天气状况",windSpeed:"风速",
    weatherHistory:"天气历史 (7天)",harvestPrediction:"收获预测",
    fiveDayForecast:"5天预报",noWeatherData:"暂无当前天气数据",
    noWeatherHistory:"暂无天气历史数据",
    noPredictionData:"暂无预测数据",
    lastUpdate:"最后更新",detections:"检测数",ripe:"成熟",unripe:"未熟",
    scanHistory:"扫描历史",noScans:"暂无扫描记录。",
  },
};

// ── Scan Gallery Component ────────────────────────────────────
function ScanGallery({ farmId, token }) {
  const [scans,        setScans]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [openFolders,  setOpenFolders]  = useState({});
  const [lightbox,     setLightbox]     = useState(null);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    api.get(`/detections/farm/${farmId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    })
      .then(r => {
        setScans(r.data || []);
        // Open the most recent folder by default
        if (r.data?.length > 0) {
          const firstKey = new Date(r.data[0].timestamp)
            .toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
          setOpenFolders({ [firstKey]: true });
        }
      })
      .catch(() => setScans([]))
      .finally(() => setLoading(false));
  }, [farmId]); // eslint-disable-line

  const toggleFolder = (key) =>
    setOpenFolders(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div style={{ textAlign:"center", padding:"1.5rem", color:"#9CA3AF" }}>
      Loading scans…
    </div>
  );

  if (!scans.length) return (
    <div style={{ textAlign:"center", padding:"1.5rem", color:"#9CA3AF", fontSize:"0.9rem" }}>
      No scans recorded yet.
    </div>
  );

  const groups = groupByDate(scans);

  return (
    <div>
      {groups.map(([date, items]) => (
        <FolderRow key={date}>
          <FolderHeader onClick={() => toggleFolder(date)}>
            <span>
              📁 {date}
              <span style={{ fontWeight:400, color:"#6B7280", marginLeft:"0.5rem", fontSize:"0.85rem" }}>
                {items.length} scan{items.length !== 1 ? "s" : ""}
              </span>
            </span>
            <span style={{ color:"#9CA3AF", fontSize:"0.85rem" }}>
              {openFolders[date] ? "▲" : "▼"}
            </span>
          </FolderHeader>

          {openFolders[date] && (
            <FolderBody>
              {items
                .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((scan, i) => {
                  const url      = imageUrl(scan.image_path);
                  const isDisease = scan.model_type === "plant_disease";
                  const healthy   = scan.is_healthy === "True" || scan.is_healthy === true;

                  return (
                    <ScanCard key={scan.id || i}>
                      {url ? (
                        <ScanImg
                          src={url}
                          alt="scan"
                          onClick={() => setLightbox(url)}
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ height:130, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", fontSize:"0.8rem" }}>
                          No image
                        </div>
                      )}
                      <ScanInfo>
                        {/* Time */}
                        <div style={{ fontSize:"0.72rem", color:"#9CA3AF", marginBottom:"0.3rem" }}>
                          {formatTime(scan.timestamp)}
                        </div>

                        {/* Result tag */}
                        {isDisease ? (
                          healthy ? (
                            <Tag bg="#D1FAE5" color="#065F46">✅ Healthy</Tag>
                          ) : (
                            <Tag bg="#FEE2E2" color="#991B1B">
                              ⚠️ {(scan.disease_type || "Disease").replace(/_/g," ")}
                            </Tag>
                          )
                        ) : (
                          <div style={{ display:"flex", gap:"0.25rem", flexWrap:"wrap" }}>
                            <Tag bg="#D1FAE5" color="#065F46">🍈 {scan.ripe || 0} ripe</Tag>
                            <Tag bg="#FEF3C7" color="#92400E">{scan.unripe || 0} unripe</Tag>
                          </div>
                        )}

                        {/* Plant type for disease scans */}
                        {isDisease && scan.plant_type && (
                          <div style={{ fontSize:"0.72rem", color:"#6B7280", marginTop:"0.25rem" }}>
                            {scan.plant_type}
                          </div>
                        )}

                        {/* Confidence */}
                        {scan.average_confidence > 0 && (
                          <div style={{ fontSize:"0.7rem", color:"#9CA3AF", marginTop:"0.2rem" }}>
                            {Math.round(scan.average_confidence * 100)}% conf.
                          </div>
                        )}
                      </ScanInfo>
                    </ScanCard>
                  );
                })}
            </FolderBody>
          )}
        </FolderRow>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox onClick={() => setLightbox(null)}>
          <LightboxImg src={lightbox} alt="scan detail" onClick={e => e.stopPropagation()} />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position:"fixed", top:"1rem", right:"1rem",
              background:"rgba(255,255,255,0.15)", border:"none",
              color:"white", fontSize:"1.8rem", cursor:"pointer",
              borderRadius:"50%", width:"40px", height:"40px",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >×</button>
        </Lightbox>
      )}
    </div>
  );
}

// ── Main SummaryPage ──────────────────────────────────────────
export default function SummaryPage({ token }) {
  const [summaryData,   setSummaryData]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedFarm,  setSelectedFarm]  = useState(null);
  const [weatherMetric, setWeatherMetric] = useState("temperature");
  const { language } = useLanguage();

  const t = useCallback((key) => translations[language]?.[key] || key, [language]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get("/summary")
      .then(r => setSummaryData(r.data || []))
      .catch(() => setSummaryData([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <SummaryContainer>
      <Card style={{ textAlign:"center", padding:"3rem" }}>
        <div style={{ fontSize:"2rem", marginBottom:"1rem" }}>⏳</div>
        <h3>{t("loading")}</h3>
      </Card>
    </SummaryContainer>
  );

  if (!summaryData.length) return (
    <SummaryContainer>
      <Card style={{ textAlign:"center", padding:"3rem" }}>
        <div style={{ fontSize:"2rem", marginBottom:"1rem" }}>📊</div>
        <h3>{t("noData")}</h3>
        <p style={{ color:"#6B7280" }}>{t("noDataDescription")}</p>
      </Card>
    </SummaryContainer>
  );

  const totalFarms      = summaryData.length;
  const totalDetections = summaryData.reduce((s,f) => s + (f.total_detections||0), 0);
  const totalRipe       = summaryData.reduce((s,f) => s + (f.total_ripe||0), 0);
  const avgHarvestPct   = summaryData.reduce((s,f) => s + (f.harvested_pct||0), 0) / totalFarms;

  const formatPredictionHistory = (history) =>
    (history||[]).map(h => ({ ...h, date: formatShortDate(h.date) }));

  const renderModal = () => {
    if (!selectedFarm) return null;
    const weather    = selectedFarm.current_weather || {};
    const hasWeather = weather.temperature !== undefined && !weather.error;

    return (
      <ModalBackground onClick={() => setSelectedFarm(null)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <CloseButton onClick={() => setSelectedFarm(null)}>×</CloseButton>

          <PageHeader style={{ textAlign:"left", marginBottom:"2rem" }}>
            <PageTitle style={{ fontSize:"2rem" }}>🌾 {selectedFarm.name}</PageTitle>
            <PageSubtitle>{t("detailedAnalytics")}</PageSubtitle>
          </PageHeader>

          {/* Stats */}
          <StatsGrid>
            {[
              { label:`🔍 ${t("totalDetections")}`, value:selectedFarm.total_detections, color:"#3B82F6" },
              { label:`🍎 ${t("ripeFruit")}`,        value:selectedFarm.total_ripe,       color:"#10B981" },
              { label:`🍏 ${t("unripeFruit")}`,      value:selectedFarm.total_unripe,     color:"#F59E0B" },
            ].map(({ label, value, color }) => (
              <StatCard key={label} color={color}>
                <StatLabel>{label}</StatLabel>
                <StatValue color={color}>{value}</StatValue>
              </StatCard>
            ))}
            <StatCard color="#8B5CF6">
              <StatLabel>📈 {t("harvestProgress")}</StatLabel>
              <StatValue color="#8B5CF6">{selectedFarm.harvested_pct?.toFixed(1)||0}%</StatValue>
              <ProgressBar><ProgressFill percentage={selectedFarm.harvested_pct||0} color="#8B5CF6"/></ProgressBar>
            </StatCard>
          </StatsGrid>

          {/* Weather */}
          <ChartCard style={{ marginBottom:"1.5rem" }}>
            <h3 style={{ color:"#1F2937", marginBottom:"1rem" }}>🌤️ {t("currentWeather")}</h3>
            {hasWeather ? (
              <WeatherGrid>
                {[
                  { icon:"🌡️", value:`${Math.round(weather.temperature)}°C`, label:t("temperature") },
                  { icon:"💧", value:`${weather.humidity}%`,                 label:t("humidity") },
                  { icon:getWeatherEmoji(weather.weather), value:weather.weather||"—", label:t("conditions") },
                  { icon:"💨", value:`${weather.wind_speed} m/s`,            label:t("windSpeed") },
                ].map(({ icon, value, label }) => (
                  <WeatherCard key={label}>
                    <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>{icon}</div>
                    <div style={{ fontWeight:"bold", fontSize:"1.1rem", textTransform:"capitalize" }}>{value}</div>
                    <div style={{ fontSize:"0.8rem", color:"#6B7280" }}>{label}</div>
                  </WeatherCard>
                ))}
              </WeatherGrid>
            ) : (
              <p style={{ color:"#6B7280", textAlign:"center", padding:"2rem" }}>{t("noWeatherData")}</p>
            )}
          </ChartCard>

          {/* Charts */}
          <ChartsGrid>
            <ChartCard>
              <h3 style={{ color:"#1F2937", marginBottom:"1rem" }}>📅 {t("weatherHistory")}</h3>
              {selectedFarm.weather_history?.length > 0 ? (
                <>
                  <select
                    value={weatherMetric}
                    onChange={e => setWeatherMetric(e.target.value)}
                    style={{ marginBottom:"1rem", padding:"0.5rem", border:"1px solid #E5E7EB", borderRadius:"6px" }}
                  >
                    <option value="temperature">{t("temperature")}</option>
                    <option value="humidity">{t("humidity")}</option>
                  </select>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={selectedFarm.weather_history}>
                      <XAxis dataKey="date" tickFormatter={formatShortDate}/>
                      <YAxis/>
                      <Tooltip labelFormatter={formatShortDate}/>
                      <Legend/>
                      <Line
                        type="monotone" dataKey={weatherMetric}
                        stroke={weatherMetric==="temperature"?"#ff7300":"#0088fe"}
                        strokeWidth={3} dot={{ fill:"#1F2937", r:4 }}
                        name={t(weatherMetric)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p style={{ color:"#6B7280", textAlign:"center", padding:"2rem" }}>{t("noWeatherHistory")}</p>
              )}
            </ChartCard>

            <ChartCard>
              <h3 style={{ color:"#1F2937", marginBottom:"1rem" }}>📊 {t("harvestPrediction")}</h3>
              {selectedFarm.prediction_history?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={formatPredictionHistory(selectedFarm.prediction_history)}>
                    <XAxis dataKey="date"/>
                    <YAxis/>
                    <Tooltip/>
                    <Legend/>
                    <Bar dataKey="ripe"   fill="#10B981" name={t("ripeFruit")}   radius={[4,4,0,0]}/>
                    <Bar dataKey="unripe" fill="#F59E0B" name={t("unripeFruit")} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color:"#6B7280", textAlign:"center", padding:"2rem" }}>{t("noPredictionData")}</p>
              )}
            </ChartCard>
          </ChartsGrid>

          {/* 5-day forecast */}
          {selectedFarm.weather_forecast?.length > 0 && (
            <ChartCard style={{ marginBottom:"1.5rem" }}>
              <h3 style={{ color:"#1F2937", marginBottom:"1rem" }}>🌦️ {t("fiveDayForecast")}</h3>
              <ForecastGrid>
                {selectedFarm.weather_forecast.slice(0,5).map((day,i) => (
                  <ForecastCard key={i} isToday={i===0}>
                    <div style={{ fontWeight:"bold", marginBottom:"0.5rem", fontSize:"0.85rem" }}>
                      {i===0?"Today":i===1?"Tomorrow":formatShortDate(day.date)}
                    </div>
                    <div style={{ fontSize:"1.8rem", marginBottom:"0.5rem" }}>{getWeatherEmoji(day.weather)}</div>
                    <div style={{ fontSize:"1.2rem", fontWeight:"bold" }}>
                      {day.temp!=null?`${Math.round(day.temp)}°C`:"—"}
                    </div>
                    <div style={{ fontSize:"0.8rem", marginTop:"0.25rem", textTransform:"capitalize", opacity:0.85 }}>
                      {day.weather||"—"}
                    </div>
                  </ForecastCard>
                ))}
              </ForecastGrid>
            </ChartCard>
          )}

          {/* ── Scan History Gallery ── */}
          <ChartCard>
            <h3 style={{ color:"#1F2937", marginBottom:"1rem" }}>📁 {t("scanHistory")}</h3>
            <ScanGallery farmId={selectedFarm.id} token={token} />
          </ChartCard>

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
          { label:`🏠 ${t("totalFarms")}`,              value:totalFarms,      color:"#3B82F6", delay:"0.1s" },
          { label:`🔍 ${t("totalDetections")}`,          value:totalDetections, color:"#10B981", delay:"0.2s" },
          { label:`🍎 ${t("totalRipeFruit")}`,           value:totalRipe,       color:"#F59E0B", delay:"0.3s" },
        ].map(({ label, value, color, delay }) => (
          <StatCard key={label} color={color} animationDelay={delay}>
            <StatLabel>{label}</StatLabel>
            <StatValue color={color}>{value}</StatValue>
          </StatCard>
        ))}
        <StatCard color="#8B5CF6" animationDelay="0.4s">
          <StatLabel>📈 {t("averageHarvestProgress")}</StatLabel>
          <StatValue color="#8B5CF6">{avgHarvestPct.toFixed(1)}%</StatValue>
          <ProgressBar><ProgressFill percentage={avgHarvestPct} color="#8B5CF6"/></ProgressBar>
        </StatCard>
      </StatsGrid>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.5rem" }}>
        {summaryData.map((farm, i) => {
          const weather    = farm.current_weather || {};
          const hasWeather = weather.temperature !== undefined && !weather.error;
          return (
            <AnimatedFarmCard key={farm.id} onClick={() => setSelectedFarm(farm)} animationDelay={`${0.1+i*0.1}s`}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
                <h3 style={{ color:"#064E3B", margin:0 }}>🌾 {farm.name}</h3>
                <div style={{ background:"#10B981", color:"white", padding:"0.25rem 0.75rem", borderRadius:"20px", fontSize:"0.8rem", fontWeight:"bold" }}>
                  {farm.harvested_pct?.toFixed(1)||0}%
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                {[
                  { label:`🔍 ${t("detections")}`, value:farm.total_detections,                                             color:"#1F2937" },
                  { label:`🍎 ${t("ripe")}`,        value:farm.total_ripe,                                                  color:"#10B981" },
                  { label:`🍏 ${t("unripe")}`,      value:farm.total_unripe,                                                color:"#F59E0B" },
                  { label:`📅 ${t("lastUpdate")}`,  value:farm.last_update?new Date(farm.last_update).toLocaleDateString():"N/A", color:"#6B7280", small:true },
                ].map(({ label, value, color, small }) => (
                  <div key={label}>
                    <StatLabel>{label}</StatLabel>
                    <div style={{ fontWeight:"bold", color, fontSize:small?"0.8rem":"inherit" }}>{value}</div>
                  </div>
                ))}
              </div>

              {hasWeather && (
                <div style={{ padding:"0.75rem", background:"linear-gradient(135deg,#F0F9FF,#E0F2FE)", borderRadius:"8px", border:"1px solid #BAE6FD" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:"0.9rem" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      {getWeatherEmoji(weather.weather)}
                      <span style={{ fontWeight:"bold" }}>{Math.round(weather.temperature)}°C</span>
                    </span>
                    <span style={{ color:"#6B7280", textTransform:"capitalize" }}>{weather.weather||"—"}</span>
                  </div>
                </div>
              )}

              <div style={{ textAlign:"center", marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid #E5E7EB", color:"#3B82F6", fontWeight:"600", fontSize:"0.9rem" }}>
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
