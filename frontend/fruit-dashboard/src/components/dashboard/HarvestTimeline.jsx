import React from "react";
import styled from "styled-components";

const HarvestContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-left: 6px solid ${props => props.borderColor || "#10B981"};
`;

const HarvestHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HarvestStage = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.color};
`;

const ConfidenceBadge = styled.span`
  background: #f1f5f9;
  color: #475569;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.color || "#10B981"};
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin: 20px 0;
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.color || "#1e293b"};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
`;

const RecommendationsList = styled.ul`
  background: #f0fdf4;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  list-style: none;
`;

const RecommendationItem = styled.li`
  margin: 8px 0;
  color: #166534;
  font-size: 0.9rem;
`;

const RisksList = styled.ul`
  background: #fef2f2;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  list-style: none;
`;

const RiskItem = styled.li`
  margin: 8px 0;
  color: #dc2626;
  font-size: 0.9rem;
`;

const HarvestDate = styled.div`
  background: #fffbeb;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid #fcd34d;
  text-align: center;
  font-weight: 600;
`;

const MetaInfo = styled.div`
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #475569;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
`;

const MetaItem = styled.div`
  text-align: center;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`;

export default function HarvestTimeline({ prediction }) {
  if (!prediction) return null;

  // Backend returns prediction directly (not nested under .timeline)
  const data = prediction.timeline || prediction;

  const stageColor = data.stage_color || "#10B981";
  const progressPct = data.visual_indicators?.progress_percentage || data.current_ripeness?.ripe_percentage || 0;
  const progressLabel = data.visual_indicators?.progress_label || data.harvest_stage || "";
  const progressEmoji = data.visual_indicators?.progress_emoji || data.stage_icon || "";

  return (
    <HarvestContainer borderColor={stageColor}>
      {/* Header */}
      <HarvestHeader>
        <HarvestStage color={stageColor}>
          <span>{data.stage_icon}</span>
          <span>{data.harvest_stage}</span>
        </HarvestStage>
        <ConfidenceBadge>
          Confidence: {Math.round((data.prediction_confidence || 0) * 100)}%
        </ConfidenceBadge>
      </HarvestHeader>

      {/* Progress Bar */}
      <div style={{ margin: "20px 0" }}>
        <ProgressBar>
          <ProgressFill percentage={progressPct} color={stageColor} />
        </ProgressBar>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#64748b" }}>
          <span>{progressEmoji} {progressLabel}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <StatValue color={stageColor}>{data.days_until_harvest ?? "—"}</StatValue>
          <StatLabel>Days Until Harvest</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue color="#dc2626">{data.current_ripeness?.ripe_count ?? 0}</StatValue>
          <StatLabel>Ripe Fruits</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue color="#16a34a">{data.current_ripeness?.unripe_count ?? 0}</StatValue>
          <StatLabel>Unripe Fruits</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue color="#4f46e5">{data.current_ripeness?.total_fruits ?? 0}</StatValue>
          <StatLabel>Total Analyzed</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Harvest Date */}
      <HarvestDate>
        🎯 Optimal Harvest Date: {data.optimal_harvest_date || "—"}
      </HarvestDate>

      {/* Analysis Metadata */}
      {data.analysis_metadata && (
        <MetaInfo>
          <MetaItem>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Last Analysis</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>
              {data.analysis_metadata.last_analysis_time
                ? new Date(data.analysis_metadata.last_analysis_time).toLocaleDateString()
                : "—"}
            </div>
          </MetaItem>
          <MetaItem>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Images Analyzed</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>{data.analysis_metadata.total_images ?? "—"}</div>
          </MetaItem>
          <MetaItem>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Avg Confidence</div>
            <div style={{ fontWeight: "600", color: "#1e293b" }}>
              {data.current_ripeness?.average_confidence
                ? `${Math.round(data.current_ripeness.average_confidence * 100)}%`
                : "—"}
            </div>
          </MetaItem>
          <MetaItem>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Urgency</div>
            <div style={{ fontWeight: "600", color: stageColor }}>{data.urgency_level || "—"}</div>
          </MetaItem>
        </MetaInfo>
      )}

      {/* Recommendations */}
      {data.recommendations?.length > 0 && (
        <div>
          <h4 style={{ marginBottom: "12px", color: "#1e293b", fontSize: "1.1rem" }}>Recommended Actions:</h4>
          <RecommendationsList>
            {data.recommendations.map((rec, i) => (
              <RecommendationItem key={i}>✅ {rec}</RecommendationItem>
            ))}
          </RecommendationsList>
        </div>
      )}

      {/* Risks */}
      {data.risks?.length > 0 && (
        <div>
          <h4 style={{ marginBottom: "12px", color: "#dc2626", fontSize: "1.1rem" }}>⚠️ Potential Risks:</h4>
          <RisksList>
            {data.risks.map((risk, i) => (
              <RiskItem key={i}>⚠️ {risk}</RiskItem>
            ))}
          </RisksList>
        </div>
      )}
    </HarvestContainer>
  );
}
