import React from "react";
import styled from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";

const SwitcherContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  border: 1px solid #f1f5f9;
`;

const SwitcherHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const SwitcherLabel = styled.label`
  font-weight: 600;
  color: #064E3B;
  font-size: 0.9rem;
`;

const ModelInfo = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const ModelButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ModelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.active ? "#10B981" : "#e5e7eb"};
  border-radius: 8px;
  background: ${props => props.active ? "#10B981" : "white"};
  color: ${props => props.active ? "white" : "#374151"};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 140px;
  justify-content: center;
  &:hover {
    border-color: #10B981;
    background: ${props => props.active ? "#10B981" : "#f0fdf4"};
  }
`;

export default function ModelSwitcher({ currentModel, onModelChange, detections = [] }) {
  const { t } = useTranslation();

  const modelStats = detections.reduce((acc, d) => {
    const type = d.model_type || "lychee";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, { lychee: 0, "360_fruits": 0 });

  return (
    <SwitcherContainer>
      <SwitcherHeader>
        <SwitcherLabel>{t("model.detectionModel")}</SwitcherLabel>
        <ModelInfo>
          {currentModel === "lychee" ? t("model.lycheeSpecialized") : t("model.multifruitSpecialized")}
        </ModelInfo>
      </SwitcherHeader>
      <ModelButtons>
        <ModelButton active={currentModel === "lychee"} onClick={() => onModelChange("lychee")}>
           {t("model.lycheeModel")}
          <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
            {modelStats.lychee} {t("common.detections")}
          </span>
        </ModelButton>
        <ModelButton active={currentModel === "360_fruits"} onClick={() => onModelChange("360_fruits")}>
           {t("model.fruits360Model")}
          <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
            {modelStats["360_fruits"]} {t("common.detections")}
          </span>
        </ModelButton>
      </ModelButtons>
    </SwitcherContainer>
  );
}
