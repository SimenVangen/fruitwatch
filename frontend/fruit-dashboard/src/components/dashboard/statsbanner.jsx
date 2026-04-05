import React from "react";
import {
  WelcomeBanner,
  BannerTitle,
  BannerSubtitle,
  StatsRow,
  Card,
  CardTitle,
  CardValue,
} from "../shared/styledcomponents";
import { useTranslation } from "../../hooks/useTranslation";

const fruitEmojis = {
  Apple: "🍎", Banana: "🍌", Orange: "🍊", Grape: "🍇",
  Pineapple: "🍍", Watermelon: "🍉", Lychee: "🍈", Unknown: "❓",
};

function getFruitEmoji(fruit) {
  return fruitEmojis[fruit] || "🍎";
}

export default function StatsBanner({ user, detections = [], currentModel = "lychee" }) {
  const { t } = useTranslation();

  const getStats = () => {
    if (currentModel === "lychee") {
      const totalFruits = detections.reduce((sum, d) => sum + (d.total_detected || 0), 0);
      const ripeCount = detections.reduce((sum, d) => sum + (d.ripe || 0), 0);
      const unripeCount = detections.reduce((sum, d) => sum + (d.unripe || 0), 0);
      return { total: totalFruits, ripeCount, unripeCount, fruitCounts: {}, fruitTypes: 1, topFruit: "Lychee" };
    }

    let totalFruits = 0;
    const fruitCounts = {};

    detections.forEach(d => {
      if (d.fruit_counts) {
        try {
          const counts = typeof d.fruit_counts === "string" ? JSON.parse(d.fruit_counts) : d.fruit_counts;
          Object.entries(counts).forEach(([fruit, count]) => {
            fruitCounts[fruit] = (fruitCounts[fruit] || 0) + count;
            totalFruits += count;
          });
        } catch {}
      } else if (d.total_detected) {
        totalFruits += d.total_detected;
      }
    });

    const fruitTypes = Object.keys(fruitCounts).length;
    const topFruit = fruitTypes > 0
      ? Object.keys(fruitCounts).reduce((a, b) => fruitCounts[a] > fruitCounts[b] ? a : b)
      : "None";

    return { total: totalFruits, ripeCount: 0, unripeCount: 0, fruitCounts, fruitTypes, topFruit };
  };

  const stats = getStats();
  const isLychee = currentModel === "lychee";

  return (
    <WelcomeBanner>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
        <div>
          <BannerTitle>{t("stats.welcome").replace("{user}", user)}</BannerTitle>
          <BannerSubtitle>
            {t("stats.subtitle")} • <strong>{isLychee ? t("stats.lycheeStats") : t("stats.fruits360Stats")}</strong>
          </BannerSubtitle>
        </div>
        <div style={{
          background: isLychee ? "#10B981" : "#3B82F6",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          fontSize: "0.875rem",
          fontWeight: "600",
        }}>
          {isLychee ? "🍈 Lychee Model" : "🍎 360 Fruits Model"}
        </div>
      </div>

      <StatsRow>
        <Card style={{ borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{isLychee ? "🔍" : "🍎"}</div>
          <CardTitle>{isLychee ? t("stats.totalDetections") : t("stats.totalFruits")}</CardTitle>
          <CardValue style={{ color: "#6B7280" }}>{stats.total}</CardValue>
        </Card>

        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{isLychee ? "🍎" : "📊"}</div>
          <CardTitle>{isLychee ? t("stats.ripeFruit") : t("stats.fruitTypes")}</CardTitle>
          <CardValue style={{ color: "#6B7280" }}>{isLychee ? stats.ripeCount : stats.fruitTypes}</CardValue>
        </Card>

        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{isLychee ? "🍏" : "🏆"}</div>
          <CardTitle>{isLychee ? t("stats.unripeFruit") : t("stats.topFruit")}</CardTitle>
          <CardValue style={{ color: "#6B7280", fontSize: stats.topFruit?.length > 10 ? "0.9rem" : "1.25rem" }}>
            {isLychee ? stats.unripeCount : stats.topFruit}
          </CardValue>
        </Card>

        <Card style={{ borderLeft: "4px solid #064E3B" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📅</div>
          <CardTitle>{t("stats.readyNextWeek")}</CardTitle>
          <CardValue style={{ color: "#6B7280" }}>
            {isLychee ? stats.ripeCount : t("common.noData")}
          </CardValue>
        </Card>
      </StatsRow>

      {!isLychee && stats.fruitTypes > 0 && (
        <div style={{
          marginTop: "1rem", padding: "1rem",
          background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0"
        }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569", fontSize: "0.9rem" }}>Fruit Distribution:</h4>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {Object.entries(stats.fruitCounts).map(([fruit, count]) => (
              <div key={fruit} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "white", padding: "0.5rem 1rem",
                borderRadius: "20px", border: "1px solid #E2E8F0"
              }}>
                <span style={{ fontSize: "1.2rem" }}>{getFruitEmoji(fruit)}</span>
                <span style={{ fontWeight: "600", color: "#475569" }}>{fruit}</span>
                <span style={{
                  background: "#3B82F6", color: "white", borderRadius: "50%",
                  width: "24px", height: "24px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: "600"
                }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WelcomeBanner>
  );
}
