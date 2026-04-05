import React from "react";
import styled from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";

const StatsContainer = styled.div`
  background: ${props => props.model === "lychee" ? "#f0fdf4" : "#f3e5f5"};
  border-left: 4px solid ${props => props.model === "lychee" ? "#10B981" : "#8B5CF6"};
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
  color: ${props => props.model === "lychee" ? "#065f46" : "#7e22ce"};
`;

const ModelDescription = styled.p`
  color: ${props => props.model === "lychee" ? "#047857" : "#7e22ce"};
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
`;

const modelInfo = {
  lychee: {
    icon: "🥭",
    name: "Lychee Detection Model",
    description: "Specialized in lychee fruit detection with high precision for lychee-specific characteristics.",
    bestFor: "Lychee farms and single-fruit type monitoring",
  },
  "360_fruits": {
    icon: "🍎",
    name: "360 Fruits Detection Model",
    description: "Multi-fruit detection system capable of identifying various fruit types in mixed orchards.",
    bestFor: "Mixed fruit farms and diverse crop monitoring",
  },
};

export default function ModelSpecificStats({ currentModel, detections = [] }) {
  const { t } = useTranslation();

  const modelDetections = detections.filter(d => (d.model_type || "lychee") === currentModel);
  const totalDetections = modelDetections.length;
  const totalFruits = modelDetections.reduce((sum, d) => sum + (d.total_detected || 0), 0);
  const avgConfidence = totalDetections > 0
    ? modelDetections.reduce((sum, d) => sum + (d.average_confidence || 0), 0) / totalDetections
    : 0;

  const info = modelInfo[currentModel];
  const color = currentModel === "lychee" ? "#065f46" : "#7e22ce";

  return (
    <StatsContainer model={currentModel}>
      <ModelHeader model={currentModel}>
        <span>{info.icon}</span>
        <span>{info.name}</span>
      </ModelHeader>

      <ModelDescription model={currentModel}>{info.description}</ModelDescription>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginTop: "0.75rem" }}>
        {[
          { value: totalDetections, label: t("common.detections") },
          { value: totalFruits, label: t("stats.totalFruits") },
          { value: `${Math.round(avgConfidence * 100)}%`, label: "Avg Confidence" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color }}>{value}</div>
            <div style={{ fontSize: "0.75rem", color }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
        <strong>Best for:</strong> {info.bestFor}
      </div>
    </StatsContainer>
  );
}
