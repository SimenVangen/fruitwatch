import React from "react";
import styled from "styled-components";

const Container = styled.div`
  background: white;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #F1F5F9;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StatBox = styled.div`
  background: ${props => props.bg || "#F8FAFC"};
  border-radius: 10px;
  padding: 1rem;
  border-left: 4px solid ${props => props.color || "#10B981"};
`;

const RecommendationList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
`;

const RiskList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
`;

export default function PredictionEngine({ harvestPrediction, detections = [] }) {
  // Calculate live stats from detections
  const totalRipe = detections.reduce((s, d) => s + (d.ripe || 0), 0);
  const totalUnripe = detections.reduce((s, d) => s + (d.unripe || 0), 0);
  const totalFruits = totalRipe + totalUnripe;
  const ripePct = totalFruits > 0 ? Math.round((totalRipe / totalFruits) * 100) : 0;

  if (!harvestPrediction && !detections.length) return null;

  const pred = harvestPrediction || {};
  const stageColor = pred.stage_color || "#10B981";
  const urgencyColors = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981", UNKNOWN: "#6B7280" };
  const urgencyColor = urgencyColors[pred.urgency_level] || "#6B7280";

  return (
    <Container>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h3 style={{ margin: 0, color: "#1F2937", fontSize: "1.1rem" }}>
            {pred.stage_icon || "📅"} Harvest Forecast
          </h3>
          {pred.harvest_stage && (
            <div style={{ fontSize: "0.85rem", color: stageColor, fontWeight: "600", marginTop: "0.25rem" }}>
              {pred.harvest_stage}
            </div>
          )}
        </div>
        {pred.urgency_level && (
          <div style={{ background: urgencyColor, color: "white", padding: "0.3rem 0.9rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700" }}>
            {pred.urgency_level}
          </div>
        )}
      </div>

      <Grid>
        {/* Days until harvest */}
        {pred.days_until_harvest !== undefined && (
          <StatBox color={stageColor} bg={`${stageColor}10`}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: stageColor }}>{pred.days_until_harvest}</div>
            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Days until harvest</div>
            {pred.optimal_harvest_date && (
              <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                Target: {pred.optimal_harvest_date}
              </div>
            )}
          </StatBox>
        )}

        {/* Current ripeness from live detections */}
        <StatBox color="#10B981" bg="#F0FDF4">
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#10B981" }}>{ripePct}%</div>
          <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Current ripeness</div>
          <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
            {totalRipe} ripe • {totalUnripe} unripe
          </div>
        </StatBox>

        {/* Confidence */}
        {pred.prediction_confidence !== undefined && (
          <StatBox color="#6366F1" bg="#EEF2FF">
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#6366F1" }}>
              {Math.round(pred.prediction_confidence * 100)}%
            </div>
            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Prediction confidence</div>
            {pred.analysis_metadata?.total_images !== undefined && (
              <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                Based on {pred.analysis_metadata.total_images} images
              </div>
            )}
          </StatBox>
        )}

        {/* Progress bar */}
        {pred.visual_indicators && (
          <StatBox color={pred.visual_indicators.progress_color || "#F59E0B"} bg="#FFFBEB">
            <div style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>
              {pred.visual_indicators.progress_emoji} {pred.visual_indicators.progress_label}
            </div>
            <div style={{
              height: "8px", background: "#E5E7EB", borderRadius: "4px", overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${Math.min(pred.visual_indicators.progress_percentage || 0, 100)}%`,
                background: pred.visual_indicators.progress_color || "#F59E0B",
                borderRadius: "4px",
                transition: "width 0.8s ease"
              }} />
            </div>
            <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.3rem" }}>
              {Math.round(pred.visual_indicators.progress_percentage || 0)}% ripening progress
            </div>
          </StatBox>
        )}
      </Grid>

      {/* Recommendations */}
      {pred.recommendations?.length > 0 && (
        <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#F0FDF4", borderRadius: "10px", border: "1px solid #BBF7D0" }}>
          <div style={{ fontWeight: "600", color: "#065F46", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            ✅ Recommendations
          </div>
          <RecommendationList>
            {pred.recommendations.map((r, i) => (
              <li key={i} style={{ color: "#065F46", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{r}</li>
            ))}
          </RecommendationList>
        </div>
      )}

      {/* Risks */}
      {pred.risks?.length > 0 && (
        <div style={{ marginTop: "0.75rem", padding: "1rem", background: "#FEF2F2", borderRadius: "10px", border: "1px solid #FECACA" }}>
          <div style={{ fontWeight: "600", color: "#991B1B", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            ⚠️ Risks
          </div>
          <RiskList>
            {pred.risks.map((r, i) => (
              <li key={i} style={{ color: "#991B1B", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{r}</li>
            ))}
          </RiskList>
        </div>
      )}
    </Container>
  );
}
