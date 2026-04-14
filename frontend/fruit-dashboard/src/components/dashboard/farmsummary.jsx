import React, { useState, useEffect } from "react";
import { Card } from "../shared/styledcomponents";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Wrap     = styled.div`animation: ${fadeIn} 0.5s ease;`;
const Bar      = styled.div`height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;margin:0.4rem 0 0.9rem;`;
const Fill     = styled.div`height:100%;border-radius:4px;transition:width 0.8s ease;width:${p=>p.pct}%;background:${p=>p.color};`;
const Row      = styled.div`display:flex;justify-content:space-between;align-items:center;font-size:0.88rem;margin-bottom:0.1rem;`;
const StatGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1.25rem;`;
const StatBox  = styled.div`background:#F8FAFC;border-radius:8px;padding:0.75rem;text-align:center;border-left:3px solid ${p=>p.color};`;

const diseaseColors = {
  Early_Blight:   "#F59E0B",
  Late_Blight:    "#EF4444",
  Leaf_Mold:      "#8B5CF6",
  Bacterial_Spot: "#EC4899",
  Healthy:        "#10B981",
};

const timeAgo = (ts) => {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function FarmSummary({ selectedFarm, detections = [], loading, currentModel }) {
  const { t } = useTranslation();
  const [ago, setAgo] = useState("");

  // Use currentModel prop (= farm.farm_type) to decide which view to show
  const isDiseaseFarm = currentModel === "plant_disease_only";

  useEffect(() => {
    const last = detections[detections.length - 1];
    setAgo(timeAgo(last?.timestamp));
  }, [detections]);

  if (loading)       return <Card><p style={{color:"#9CA3AF"}}>Loading…</p></Card>;
  if (!selectedFarm) return <Card><p style={{color:"#9CA3AF"}}>Select a farm to see summary.</p></Card>;
  if (!detections.length) return (
    <Card>
      <p style={{ color:"#9CA3AF", fontSize:"0.9rem", textAlign:"center", padding:"1rem 0" }}>
        No data yet — detections will appear here once your drone sends images.
      </p>
    </Card>
  );

  // ── Compute stats ──────────────────────────────────────────
  let totalRipe = 0, totalUnripe = 0;
  const diseaseCounts = {};
  let healthyCount = 0, diseasedCount = 0;

  detections.forEach(d => {
    if (isDiseaseFarm) {
      // Disease farm — count health status
      if (d.disease_type) {
        diseaseCounts[d.disease_type] = (diseaseCounts[d.disease_type] || 0) + 1;
      }
      if (d.is_healthy === "True"  || d.is_healthy === true)  healthyCount++;
      if (d.is_healthy === "False" || d.is_healthy === false) diseasedCount++;
    } else {
      // Lychee farm — count ripe/unripe
      totalRipe   += Number(d.ripe)   || 0;
      totalUnripe += Number(d.unripe) || 0;
    }
  });

  const totalFruits   = totalRipe + totalUnripe;
  const totalDisease  = healthyCount + diseasedCount;
  const healthPct     = totalDisease > 0 ? Math.round((healthyCount / totalDisease) * 100) : 0;
  const latest        = detections[detections.length - 1];
  const latestRipe    = latest?.ripe    || 0;
  const latestUnripe  = latest?.unripe  || 0;
  const latestTotal   = latestRipe + latestUnripe;
  const latestRipePct = latestTotal > 0 ? Math.round((latestRipe / latestTotal) * 100) : 0;

  return (
    <Card>
      <Wrap>
        {/* Header */}
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:"1.25rem", paddingBottom:"0.75rem", borderBottom:"1px solid #F3F4F6"
        }}>
          <div>
            <div style={{ fontWeight:600, color:"#1F2937", fontSize:"1rem" }}>{selectedFarm.name}</div>
            <div style={{ fontSize:"0.78rem", color:"#9CA3AF", marginTop:"0.1rem" }}>
              {detections.length} scan{detections.length !== 1 ? "s" : ""} • updated {ago}
            </div>
          </div>
          <div style={{
            fontSize:"0.72rem", background:"#F0FDF4", color:"#065F46",
            padding:"0.25rem 0.6rem", borderRadius:"20px", border:"1px solid #BBF7D0"
          }}>
            Live
          </div>
        </div>

        {/* ── LYCHEE VIEW ── */}
        {!isDiseaseFarm && (
          <>
            <div style={{ fontSize:"0.8rem", fontWeight:600, color:"#6B7280", marginBottom:"0.75rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>
              Ripeness — latest scan
            </div>
            <Row>
              <span>🍈 Ripe</span>
              <span style={{ fontWeight:600, color:"#10B981" }}>{latestRipe} ({latestRipePct}%)</span>
            </Row>
            <Bar><Fill pct={latestRipePct} color="#10B981"/></Bar>
            <Row>
              <span>🍏 Unripe</span>
              <span style={{ fontWeight:600, color:"#F59E0B" }}>{latestUnripe} ({100 - latestRipePct}%)</span>
            </Row>
            <Bar><Fill pct={100 - latestRipePct} color="#F59E0B"/></Bar>
            <StatGrid>
              <StatBox color="#10B981">
                <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#10B981" }}>{totalRipe}</div>
                <div style={{ fontSize:"0.72rem", color:"#9CA3AF" }}>Total ripe</div>
              </StatBox>
              <StatBox color="#F59E0B">
                <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#F59E0B" }}>{totalUnripe}</div>
                <div style={{ fontSize:"0.72rem", color:"#9CA3AF" }}>Total unripe</div>
              </StatBox>
            </StatGrid>
          </>
        )}

        {/* ── PLANT DISEASE VIEW ── */}
        {isDiseaseFarm && (
          <>
            <div style={{ fontSize:"0.8rem", fontWeight:600, color:"#6B7280", marginBottom:"0.75rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>
              Plant Health
            </div>

            {totalDisease === 0 ? (
              <p style={{ color:"#9CA3AF", fontSize:"0.85rem" }}>
                No disease data yet — confidence may be too low on recent scans.
              </p>
            ) : (
              <>
                <Row>
                  <span>✅ Healthy</span>
                  <span style={{ fontWeight:600, color:"#10B981" }}>{healthyCount} ({healthPct}%)</span>
                </Row>
                <Bar><Fill pct={healthPct} color="#10B981"/></Bar>
                <Row>
                  <span>⚠️ Diseased</span>
                  <span style={{ fontWeight:600, color:"#EF4444" }}>{diseasedCount} ({100 - healthPct}%)</span>
                </Row>
                <Bar><Fill pct={100 - healthPct} color="#EF4444"/></Bar>

                <StatGrid>
                  <StatBox color="#10B981">
                    <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#10B981" }}>{healthyCount}</div>
                    <div style={{ fontSize:"0.72rem", color:"#9CA3AF" }}>Healthy</div>
                  </StatBox>
                  <StatBox color="#EF4444">
                    <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#EF4444" }}>{diseasedCount}</div>
                    <div style={{ fontSize:"0.72rem", color:"#9CA3AF" }}>Diseased</div>
                  </StatBox>
                </StatGrid>

                {/* Disease breakdown */}
                {Object.keys(diseaseCounts).length > 0 && (
                  <div style={{ marginTop:"1rem" }}>
                    <div style={{ fontSize:"0.8rem", fontWeight:600, color:"#6B7280", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                      Disease Breakdown
                    </div>
                    {Object.entries(diseaseCounts)
                      .sort(([,a],[,b]) => b - a)
                      .slice(0, 5)
                      .map(([disease, count]) => {
                        const pct   = totalDisease > 0 ? Math.round((count / totalDisease) * 100) : 0;
                        const color = diseaseColors[disease] || "#6B7280";
                        return (
                          <div key={disease} style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
                            <span style={{ fontSize:"0.8rem", minWidth:"130px", color:"#374151" }}>
                              {disease.replace(/_/g, " ")}
                            </span>
                            <div style={{ flex:1, height:"6px", background:"#E2E8F0", borderRadius:"3px", overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:"3px" }}/>
                            </div>
                            <span style={{ fontSize:"0.78rem", color:"#9CA3AF", minWidth:"30px", textAlign:"right" }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </Wrap>
    </Card>
  );
}
