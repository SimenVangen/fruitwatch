import React, { useMemo } from "react";
import { Card } from "../shared/styledcomponents";
import styled from "styled-components";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from "recharts";

const TabRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const Tab = styled.button`
  padding: 0.4rem 1rem;
  border-radius: 8px;
  border: 1.5px solid ${props => props.active ? "#10B981" : "#E5E7EB"};
  background: ${props => props.active ? "#10B981" : "white"};
  color: ${props => props.active ? "white" : "#6B7280"};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #10B981; }
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const SummaryCard = styled.div`
  background: #F8FAFC;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  text-align: center;
  border-left: 3px solid ${props => props.color};
`;

const formatDate = (ts) => {
  try {
    return new Date(ts).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  } catch { return ts; }
};

const formatDateTime = (ts) => {
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } catch { return ts; }
};

export default function WeeklyProgress({ selectedFarm, detections = [] }) {
  const [view, setView] = React.useState("daily");

  const chartData = useMemo(() => {
    if (!detections.length) return [];

    if (view === "each") {
      // One bar per detection, sorted oldest first
      return [...detections]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((d, i) => ({
          label: `#${i + 1}`,
          fullLabel: formatDateTime(d.timestamp),
          ripe: d.ripe || 0,
          unripe: d.unripe || 0,
          total: d.total_detected || 0,
          confidence: d.average_confidence ? Math.round(d.average_confidence * 100) : 0,
        }));
    }

    if (view === "daily") {
      const groups = {};
      detections.forEach(d => {
        const key = formatDate(d.timestamp);
        if (!groups[key]) groups[key] = { label: key, ripe: 0, unripe: 0, total: 0, count: 0 };
        groups[key].ripe += d.ripe || 0;
        groups[key].unripe += d.unripe || 0;
        groups[key].total += d.total_detected || 0;
        groups[key].count++;
      });
      return Object.values(groups).sort((a, b) => new Date(a.label) - new Date(b.label));
    }

    if (view === "ripeness") {
      return [...detections]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((d, i) => {
          const total = (d.ripe || 0) + (d.unripe || 0);
          return {
            label: `#${i + 1}`,
            fullLabel: formatDateTime(d.timestamp),
            ripeness: total > 0 ? Math.round((d.ripe / total) * 100) : 0,
          };
        });
    }

    return [];
  }, [detections, view]);

  const totalRipe = detections.reduce((s, d) => s + (d.ripe || 0), 0);
  const totalUnripe = detections.reduce((s, d) => s + (d.unripe || 0), 0);
  const totalFruits = totalRipe + totalUnripe;
  const avgRipeness = totalFruits > 0 ? Math.round((totalRipe / totalFruits) * 100) : 0;

  if (!selectedFarm) return (
    <Card><p style={{ color: "#6B7280", textAlign: "center", padding: "2rem" }}>No farm selected</p></Card>
  );

  if (!detections.length) return (
    <Card><p style={{ color: "#6B7280", textAlign: "center", padding: "2rem" }}>No detection data yet. Upload drone images to see progress.</p></Card>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "0.75rem", fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <div style={{ fontWeight: "600", marginBottom: "0.4rem", color: "#1F2937" }}>{data?.fullLabel || label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}{view === "ripeness" ? "%" : ""}</strong></div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h3 style={{ margin: 0, color: "#1F2937", fontSize: "1.1rem" }}>Detection History</h3>
        <TabRow style={{ margin: 0 }}>
          <Tab active={view === "each"} onClick={() => setView("each")}>Per Detection</Tab>
          <Tab active={view === "daily"} onClick={() => setView("daily")}>Daily</Tab>
          <Tab active={view === "ripeness"} onClick={() => setView("ripeness")}>Ripeness %</Tab>
        </TabRow>
      </div>

      {/* Summary stats */}
      <SummaryRow>
        {[
          { label: "Detections", value: detections.length, color: "#6366F1" },
          { label: "Total Fruits", value: totalFruits, color: "#3B82F6" },
          { label: "Ripe", value: totalRipe, color: "#10B981" },
          { label: "Avg Ripeness", value: `${avgRipeness}%`, color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <SummaryCard key={label} color={color}>
            <div style={{ fontSize: "1.4rem", fontWeight: "700", color }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "0.2rem" }}>{label}</div>
          </SummaryCard>
        ))}
      </SummaryRow>

      {/* Chart */}
      {view === "ripeness" ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="ripeness" stroke="#10B981" strokeWidth={3} dot={{ fill: "#10B981", r: 5 }} name="Ripeness" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "0.82rem" }} />
            <Bar dataKey="ripe" fill="#10B981" name="Ripe" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unripe" fill="#F59E0B" name="Unripe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#9CA3AF", textAlign: "center" }}>
        {detections.length} total detections • Last updated {formatDateTime(detections[0]?.timestamp)}
      </div>
    </Card>
  );
}
