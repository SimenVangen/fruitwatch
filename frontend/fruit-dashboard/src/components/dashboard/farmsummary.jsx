import React, { useState, useEffect } from "react";
import { Card } from "../shared/styledcomponents";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SummaryContainer = styled.div`animation: ${fadeIn} 0.6s ease;`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const StatCard = styled.div`
  background: #F8FAFC;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid ${props => props.color};
`;

const TimeStamp = styled.div`
  background: #F0F9FF;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  margin-top: 1rem;
  border: 1px solid #E0F2FE;
  font-size: 0.9rem;
  color: #0369A1;
`;

const FruitDistributionContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
`;

const FruitItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #E2E8F0;
  &:last-child { border-bottom: none; }
`;

const FruitBar = styled.div`
  flex: 1;
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  margin: 0 1rem;
  overflow: hidden;
`;

const FruitBarFill = styled.div`
  height: 100%;
  background: ${props => props.color};
  border-radius: 3px;
  width: ${props => props.percentage}%;
`;

const ProgressContainer = styled.div`margin: 1rem 0;`;

const ProgressBar = styled.div`
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.color};
  border-radius: 4px;
  transition: width 0.8s ease;
  width: ${props => props.percentage}%;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
`;

const fruitColors = {
  Apple: "#EF4444", Banana: "#F59E0B", Orange: "#EA580C",
  Grape: "#7C3AED", Pineapple: "#84CC16", Watermelon: "#10B981", Lychee: "#EC4899",
};

const fruitEmojis = {
  Apple: "🍎", Banana: "🍌", Orange: "🍊",
  Grape: "🍇", Pineapple: "🍍", Watermelon: "🍉", Lychee: "🍈",
};

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Never updated";
  const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

export default function FarmSummary({ selectedFarm, detections, loading, currentModel = "lychee" }) {
  const [timeAgo, setTimeAgo] = useState("");
  const { t } = useTranslation();

  const is360Fruits = currentModel === "360_fruits";

  useEffect(() => {
    if (detections?.length > 0) {
      setTimeAgo(getTimeAgo(detections[detections.length - 1]?.timestamp));
    }
  }, [detections]);

  const calculateStats = () => {
    if (!detections?.length) return { totalFruits: 0, totalRipe: 0, totalUnripe: 0, ripePercentage: 0, fruitCounts: {}, fruitTypes: 0, topFruit: "None", latestRipe: 0, latestUnripe: 0, latestRipePercentage: 0 };

    let totalFruits = 0, totalRipe = 0, totalUnripe = 0;
    const fruitCounts = {};

    detections.forEach(d => {
      if (d.ripe !== undefined && d.unripe !== undefined) {
        const ripe = Number(d.ripe) || 0;
        const unripe = Number(d.unripe) || 0;
        totalRipe += ripe;
        totalUnripe += unripe;
        totalFruits += ripe + unripe;
        fruitCounts["Lychee"] = (fruitCounts["Lychee"] || 0) + (ripe + unripe);
      }
      if (d.fruit_counts && typeof d.fruit_counts === "object") {
        Object.entries(d.fruit_counts).forEach(([fruit, count]) => {
          const n = Number(count) || 0;
          if (n > 0) { fruitCounts[fruit] = (fruitCounts[fruit] || 0) + n; totalFruits += n; }
        });
      }
    });

    Object.keys(fruitCounts).forEach(f => { if (!fruitCounts[f]) delete fruitCounts[f]; });

    const fruitTypes = Object.keys(fruitCounts).length;
    const topFruit = fruitTypes > 0 ? Object.keys(fruitCounts).reduce((a, b) => fruitCounts[a] > fruitCounts[b] ? a : b) : "None";
    const ripePercentage = totalFruits > 0 ? Math.round((totalRipe / totalFruits) * 100) : 0;
    const latest = detections[detections.length - 1];
    const latestRipe = latest?.ripe || 0;
    const latestUnripe = latest?.unripe || 0;
    const latestTotal = latestRipe + latestUnripe;
    const latestRipePercentage = latestTotal > 0 ? Math.round((latestRipe / latestTotal) * 100) : 0;

    return { totalFruits, totalRipe, totalUnripe, ripePercentage, fruitCounts, fruitTypes, topFruit, latestRipe, latestUnripe, latestRipePercentage };
  };

  if (loading) return <Card><p>{t("farmSummary.loading")}</p></Card>;
  if (!selectedFarm) return <Card><p>{t("farmSummary.noFarmSelected")}</p></Card>;
  if (!detections?.length) return <Card><p>{t("farmSummary.noDetectionData")}</p></Card>;

  const stats = calculateStats();

  return (
    <Card>
      <SummaryContainer>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #E5E7EB" }}>
          <div>
            <h3 style={{ margin: 0, color: "#1F2937" }}>
              {is360Fruits ? t("farmSummary.fruits360Summary") : t("farmSummary.lycheeSummary")}
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#6B7280" }}>
              {selectedFarm.name} • {detections.length} {t("common.detections")}
            </p>
          </div>
          <div style={{ background: is360Fruits ? "#3B82F6" : "#EC4899", color: "white", padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
            {is360Fruits ? "🍎 360 Fruits" : "🍈 Lychee"}
          </div>
        </div>

        {/* 360 Fruits View */}
        {is360Fruits && Object.keys(stats.fruitCounts).length > 0 && (
          <FruitDistributionContainer>
            <h4 style={{ marginBottom: "1rem", fontSize: "1rem", color: "#1F2937" }}>{t("farmSummary.fruitDistribution")}</h4>
            {Object.entries(stats.fruitCounts).sort(([, a], [, b]) => b - a).map(([fruit, count]) => {
              const pct = stats.totalFruits > 0 ? Math.round((count / stats.totalFruits) * 100) : 0;
              return (
                <FruitItem key={fruit}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "100px" }}>
                    <span style={{ fontSize: "1.2rem" }}>{fruitEmojis[fruit] || "🍎"}</span>
                    <span style={{ fontSize: "0.9rem" }}>{fruit}</span>
                  </div>
                  <FruitBar><FruitBarFill percentage={pct} color={fruitColors[fruit] || "#6B7280"} /></FruitBar>
                  <div style={{ fontSize: "0.9rem", fontWeight: "600", color: fruitColors[fruit] || "#6B7280", minWidth: "60px", textAlign: "right" }}>
                    {count} ({pct}%)
                  </div>
                </FruitItem>
              );
            })}
          </FruitDistributionContainer>
        )}

        {/* Lychee View */}
        {!is360Fruits && stats.totalFruits > 0 && (
          <ProgressContainer>
            <h4 style={{ marginBottom: "1rem", fontSize: "1rem", color: "#1F2937" }}>{t("farmSummary.latestDetectionAnalysis")}</h4>
            <ProgressLabel>
              <span>🍎 {t("farmSummary.ripeFruit")}</span>
              <span style={{ fontWeight: "bold", color: "#10B981" }}>{stats.latestRipe} ({stats.latestRipePercentage}%)</span>
            </ProgressLabel>
            <ProgressBar><ProgressFill percentage={stats.latestRipePercentage} color="#10B981" /></ProgressBar>
            <ProgressLabel>
              <span>🍏 {t("farmSummary.unripeFruit")}</span>
              <span style={{ fontWeight: "bold", color: "#F59E0B" }}>{stats.latestUnripe} ({100 - stats.latestRipePercentage}%)</span>
            </ProgressLabel>
            <ProgressBar><ProgressFill percentage={100 - stats.latestRipePercentage} color="#F59E0B" /></ProgressBar>
          </ProgressContainer>
        )}

        {/* Stats Grid */}
        <StatsGrid>
          <StatCard color="#3B82F6">
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3B82F6" }}>{stats.totalFruits}</div>
            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("farmSummary.totalFruits")}</div>
          </StatCard>

          {!is360Fruits ? (
            <>
              <StatCard color="#10B981">
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10B981" }}>{stats.totalRipe}</div>
                <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("farmSummary.totalRipe")}</div>
              </StatCard>
              <StatCard color="#F59E0B">
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#F59E0B" }}>{stats.totalUnripe}</div>
                <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("farmSummary.totalUnripe")}</div>
              </StatCard>
            </>
          ) : (
            <>
              <StatCard color="#10B981">
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10B981" }}>{stats.fruitTypes}</div>
                <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("farmSummary.fruitTypes")}</div>
              </StatCard>
              <StatCard color="#F59E0B">
                <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#F59E0B" }}>{fruitEmojis[stats.topFruit] || ""} {stats.topFruit}</div>
                <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("farmSummary.topFruit")}</div>
              </StatCard>
            </>
          )}

          <StatCard color="#8B5CF6">
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#8B5CF6" }}>{detections.length}</div>
            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{t("common.detections")}</div>
          </StatCard>
        </StatsGrid>

        <TimeStamp>⏰ {t("farmSummary.updated")} {timeAgo}</TimeStamp>
      </SummaryContainer>
    </Card>
  );
}
