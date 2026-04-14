import React from "react";
import styled from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";

const StatsContainer = styled.div`
  background: ${props => props.model === "plant_disease_only" ? "#fffbeb" : "#f0fdf4"};
  border-left: 4px solid ${props => props.model === "plant_disease_only" ? "#F59E0B" : "#10B981"};
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
`;

const ModelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: ${props => props.model === "plant_disease_only" ? "#92400e" : "#065f46"};
`;

const ModelDescription = styled.p`
  color: ${props => props.model === "plant_disease_only" ? "#b45309" : "#047857"};
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
`;

const modelInfo = {
  lychee: {
    icon:        "🍈",
    name:        "Lychee Detection Model",
    description: "Specialized in lychee fruit detection with ripe/unripe classification via color analysis.",
    bestFor:     "Lychee farms",
    color:       "#065f46",
  },
  plant_disease_only: {
    icon:        "🌿",
    name:        "Plant Disease Detection Model",
    description: "Identifies diseases across tomato, potato, pepper, apple, grape, corn, peach, strawberry and cherry leaves.",
    bestFor:     "Plant health monitoring — no fruit counting",
    color:       "#92400e",
  },
};

export default function ModelSpecificStats({ currentModel, detections = [] }) {
  const { t } = useTranslation();

  const modelDetections = detections.filter(
    d => (d.model_type || "lychee") === currentModel
  );
  const totalDetections  = modelDetections.length;
  const totalFruits      = modelDetections.reduce((sum, d) => sum + (d.total_detected || 0), 0);
  const avgConfidence    = totalDetections > 0
    ? modelDetections.reduce((sum, d) => sum + (d.average_confidence || 0), 0) / totalDetections
    : 0;

  const info  = modelInfo[currentModel] || modelInfo.lychee;
  const color = info.color;

  // Plant disease specific stats
  const diseaseCounts = {};
  let healthyCount = 0, diseasedCount = 0;

  if (currentModel === "plant_disease_only") {
    modelDetections.forEach(d => {
      if (d.disease_type) diseaseCounts[d.disease_type] = (diseaseCounts[d.disease_type] || 0) + 1;
      if (d.is_healthy === "True"  || d.is_healthy === true)  healthyCount++;
      if (d.is_healthy === "False" || d.is_healthy === false) diseasedCount++;
    });
  }

  const topDisease = Object.keys(diseaseCounts).length > 0
    ? Object.keys(diseaseCounts).reduce((a, b) => diseaseCounts[a] > diseaseCounts[b] ? a : b)
    : null;

  return (
    <StatsContainer model={currentModel}>
      <ModelHeader model={currentModel}>
        <span>{info.icon}</span>
        <span>{info.name}</span>
      </ModelHeader>

      <ModelDescription model={currentModel}>{info.description}</ModelDescription>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "0.5rem",
        marginTop: "0.75rem"
      }}>
        {[
          { value: totalDetections, label: t("common.detections") },
          { value: totalFruits,     label: t("stats.totalFruits") },
          { value: `${Math.round(avgConfidence * 100)}%`, label: "Avg Confidence" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color }}>{value}</div>
            <div style={{ fontSize: "0.75rem", color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Plant disease extra stats */}
      {currentModel === "plant_disease_only" && totalDetections > 0 && (
        <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div style={{ background: "#d1fae5", borderRadius: "6px", padding: "0.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#065f46" }}>{healthyCount}</div>
            <div style={{ fontSize: "0.75rem", color: "#065f46" }}>✅ Healthy</div>
          </div>
          <div style={{ background: "#fee2e2", borderRadius: "6px", padding: "0.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#991b1b" }}>{diseasedCount}</div>
            <div style={{ fontSize: "0.75rem", color: "#991b1b" }}>⚠️ Diseased</div>
          </div>
          {topDisease && (
            <div style={{ gridColumn: "1 / -1", background: "#fef3c7", borderRadius: "6px", padding: "0.5rem", fontSize: "0.8rem", color: "#92400e" }}>
              <strong>Most common:</strong> {topDisease.replace(/_/g, " ")}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
        <strong>Best for:</strong> {info.bestFor}
      </div>
    </StatsContainer>
  );
}
