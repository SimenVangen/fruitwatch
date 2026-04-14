import React from "react";
import {
  WelcomeBanner, BannerTitle, BannerSubtitle,
  StatsRow, Card, CardTitle, CardValue,
} from "../shared/styledcomponents";
import { useTranslation } from "../../hooks/useTranslation";

const fruitEmojis = {
  Apple: "🍎", Banana: "🍌", Orange: "🍊", Grape: "🍇",
  Pineapple: "🍍", Watermelon: "🍉", Lychee: "🍈", Unknown: "❓",
};

const MODEL_CONFIG = {
  lychee: {
    badge: "🍈 Lychee Model",
    badgeColor: "#EC4899",
    subtitle: "Lychee Statistics",
  },
  "360_fruits": {
    badge: "🍎 360 Fruits Model",
    badgeColor: "#3B82F6",
    subtitle: "360 Fruits Statistics",
  },
  plant_disease: {
    badge: "🌿 Plant Disease Model",
    badgeColor: "#F59E0B",
    subtitle: "Plant Health Statistics",
  },
};

export default function StatsBanner({ user, detections = [], currentModel = "lychee" }) {
  const { t } = useTranslation();
  const config = MODEL_CONFIG[currentModel] || MODEL_CONFIG.lychee;

  const getStats = () => {
    if (currentModel === "plant_disease") {
      const total = detections.length;
      const healthy = detections.filter(d => d.is_healthy === "True" || d.is_healthy === true).length;
      const diseased = detections.filter(d => d.is_healthy === "False" || d.is_healthy === false).length;
      const healthPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
      const diseaseCounts = {};
      detections.forEach(d => {
        if (d.disease_type) diseaseCounts[d.disease_type] = (diseaseCounts[d.disease_type] || 0) + 1;
      });
      const topDisease = Object.keys(diseaseCounts).length > 0
        ? Object.keys(diseaseCounts).reduce((a, b) => diseaseCounts[a] > diseaseCounts[b] ? a : b)
        : "None";
      return { total, healthy, diseased, healthPct, topDisease };
    }

    if (currentModel === "lychee") {
      const total = detections.reduce((s, d) => s + (d.total_detected || 0), 0);
      const ripe = detections.reduce((s, d) => s + (d.ripe || 0), 0);
      const unripe = detections.reduce((s, d) => s + (d.unripe || 0), 0);
      return { total, ripe, unripe };
    }

    // 360 fruits
    let total = 0;
    const fruitCounts = {};
    detections.forEach(d => {
      if (d.fruit_counts) {
        try {
          const counts = typeof d.fruit_counts === "string" ? JSON.parse(d.fruit_counts) : d.fruit_counts;
          Object.entries(counts).forEach(([fruit, count]) => {
            fruitCounts[fruit] = (fruitCounts[fruit] || 0) + count;
            total += count;
          });
        } catch {}
      } else if (d.total_detected) {
        total += d.total_detected;
      }
    });
    const fruitTypes = Object.keys(fruitCounts).length;
    const topFruit = fruitTypes > 0
      ? Object.keys(fruitCounts).reduce((a, b) => fruitCounts[a] > fruitCounts[b] ? a : b)
      : "None";
    return { total, fruitCounts, fruitTypes, topFruit };
  };

  const stats = getStats();

  const cards = currentModel === "plant_disease"
    ? [
        { icon: "🔍", label: "Scans", value: stats.total, border: "#6366F1" },
        { icon: "✅", label: "Healthy", value: stats.healthy, border: "#10B981" },
        { icon: "⚠️", label: "Diseased", value: stats.diseased, border: "#EF4444" },
        { icon: "📊", label: "Health Rate", value: `${stats.healthPct}%`, border: "#F59E0B" },
      ]
    : currentModel === "lychee"
    ? [
        { icon: "🔍", label: t("stats.totalDetections"), value: stats.total, border: "#EF4444" },
        { icon: "🍎", label: t("stats.ripeFruit"), value: stats.ripe, border: "#10B981" },
        { icon: "🍏", label: t("stats.unripeFruit"), value: stats.unripe, border: "#F59E0B" },
        { icon: "📅", label: t("stats.readyNextWeek"), value: stats.ripe, border: "#064E3B" },
      ]
    : [
        { icon: "🍎", label: t("stats.totalFruits"), value: stats.total, border: "#EF4444" },
        { icon: "📊", label: t("stats.fruitTypes"), value: stats.fruitTypes, border: "#10B981" },
        { icon: "🏆", label: t("stats.topFruit"), value: stats.topFruit, border: "#F59E0B" },
        { icon: "🔍", label: t("stats.totalDetections"), value: detections.length, border: "#064E3B" },
      ];

  return (
    <WelcomeBanner>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
        <div>
          <BannerTitle>{t("stats.welcome").replace("{user}", user)}</BannerTitle>
          <BannerSubtitle>
            {t("stats.subtitle")} • <strong>{config.subtitle}</strong>
          </BannerSubtitle>
        </div>
        <div style={{
          background: config.badgeColor, color: "white",
          padding: "0.5rem 1rem", borderRadius: "20px",
          fontSize: "0.875rem", fontWeight: "600",
        }}>
          {config.badge}
        </div>
      </div>

      <StatsRow>
        {cards.map(({ icon, label, value, border }) => (
          <Card key={label} style={{ borderLeft: `4px solid ${border}` }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{icon}</div>
            <CardTitle>{label}</CardTitle>
            <CardValue style={{ color: "#6B7280" }}>{value}</CardValue>
          </Card>
        ))}
      </StatsRow>

      {currentModel === "360_fruits" && stats.fruitTypes > 0 && (
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
                <span style={{ fontSize: "1.2rem" }}>{fruitEmojis[fruit] || "🍎"}</span>
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
