import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import api from "../../api/axios";

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Widget = styled.div`
  background: white;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  animation: ${fadeIn} 0.4s ease;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  color: #065F46;
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
`;

const LiveDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: ${p => p.online ? "#10B981" : "#9CA3AF"};
  &::before {
    content: "";
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${p => p.online ? "#10B981" : "#9CA3AF"};
  }
`;

const ReadingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const ReadingCard = styled.div`
  background: #F8FAFC;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  border-left: 3px solid ${p => p.color};
`;

const ReadingValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${p => p.color};
  line-height: 1;
  margin-bottom: 0.25rem;
`;

const ReadingLabel = styled.div`
  font-size: 0.72rem;
  color: #9CA3AF;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #9CA3AF;
`;

const getTemperatureColor = (temp) => {
  if (temp === null) return "#9CA3AF";
  if (temp < 15)  return "#3B82F6";  // cold — blue
  if (temp < 25)  return "#10B981";  // comfortable — green
  if (temp < 35)  return "#F59E0B";  // warm — amber
  return "#EF4444";                   // hot — red
};

const getHumidityColor = (hum) => {
  if (hum === null) return "#9CA3AF";
  if (hum < 30) return "#F59E0B";   // too dry — amber
  if (hum < 70) return "#10B981";   // comfortable — green
  return "#3B82F6";                  // humid — blue
};

const getTemperatureLabel = (temp) => {
  if (temp === null) return "";
  if (temp < 15)  return "❄️ Cold";
  if (temp < 25)  return "✅ Comfortable";
  if (temp < 35)  return "☀️ Warm";
  return "🔥 Hot";
};

const getHumidityLabel = (hum) => {
  if (hum === null) return "";
  if (hum < 30) return "💨 Dry";
  if (hum < 70) return "✅ Good";
  return "💧 Humid";
};

const timeAgo = (ts) => {
  if (!ts) return "No reading yet";
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function SensorWidget({ farmId }) {
  const [reading,   setReading]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchReading = async () => {
    if (!farmId) return;
    try {
      const res = await api.get(`/sensors/latest/${farmId}`);
      setReading(res.data);
      setLastFetch(new Date());
    } catch (e) {
      console.error("Sensor fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReading();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReading, 30000);
    return () => clearInterval(interval);
  }, [farmId]); // eslint-disable-line

  const temp    = reading?.temperature ?? null;
  const hum     = reading?.humidity    ?? null;
  const ts      = reading?.timestamp   ?? null;
  const online  = ts && (Date.now() - new Date(ts)) < 120000; // online if reading < 2 min old

  if (loading) return (
    <Widget>
      <Header>
        <Title>🌡️ Environment</Title>
        <LiveDot online={false}>Loading…</LiveDot>
      </Header>
      <ReadingsGrid>
        <ReadingCard color="#9CA3AF">
          <ReadingValue color="#9CA3AF">—</ReadingValue>
          <ReadingLabel>Temperature</ReadingLabel>
        </ReadingCard>
        <ReadingCard color="#9CA3AF">
          <ReadingValue color="#9CA3AF">—</ReadingValue>
          <ReadingLabel>Humidity</ReadingLabel>
        </ReadingCard>
      </ReadingsGrid>
    </Widget>
  );

  return (
    <Widget>
      <Header>
        <Title>🌡️ Environment</Title>
        <LiveDot online={online}>
          {online ? "Live" : "Offline"}
        </LiveDot>
      </Header>

      {temp === null && hum === null ? (
        <div style={{ textAlign:"center", color:"#9CA3AF", fontSize:"0.85rem", padding:"1rem 0" }}>
          No sensor readings yet.<br/>
          Connect your DHT22 and run the sensor script on your Pi5.
        </div>
      ) : (
        <>
          <ReadingsGrid>
            <ReadingCard color={getTemperatureColor(temp)}>
              <ReadingValue color={getTemperatureColor(temp)}>
                {temp !== null ? `${temp}°` : "—"}
              </ReadingValue>
              <ReadingLabel>Temperature °C</ReadingLabel>
              {temp !== null && (
                <div style={{ fontSize:"0.7rem", color: getTemperatureColor(temp), marginTop:"0.25rem" }}>
                  {getTemperatureLabel(temp)}
                </div>
              )}
            </ReadingCard>

            <ReadingCard color={getHumidityColor(hum)}>
              <ReadingValue color={getHumidityColor(hum)}>
                {hum !== null ? `${hum}%` : "—"}
              </ReadingValue>
              <ReadingLabel>Humidity</ReadingLabel>
              {hum !== null && (
                <div style={{ fontSize:"0.7rem", color: getHumidityColor(hum), marginTop:"0.25rem" }}>
                  {getHumidityLabel(hum)}
                </div>
              )}
            </ReadingCard>
          </ReadingsGrid>

          <StatusRow>
            <span>DHT22 · GPIO 4</span>
            <span>Updated {timeAgo(ts)}</span>
          </StatusRow>
        </>
      )}
    </Widget>
  );
}
