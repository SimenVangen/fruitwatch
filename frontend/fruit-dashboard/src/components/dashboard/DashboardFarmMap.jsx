import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card } from "../shared/styledcomponents";
import FarmSelector from "./farmselector";
import { useTranslation } from "../../hooks/useTranslation";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (color) => new L.DivIcon({
  html: `<div style="background-color:${color};width:20px;height:20px;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: "custom-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const getStatusColor = (ripe, unripe) => {
  const total = ripe + unripe;
  if (total === 0) return "#6B7280";
  const pct = (ripe / total) * 100;
  if (pct >= 70) return "#10B981";
  if (pct >= 40) return "#F59E0B";
  return "#EF4444";
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 14); }, [center, map]);
  return null;
}

export default function DashboardFarmMap({ selectedFarm, farms, setSelectedFarm, detections: liveDetections }) {
  const [mapReady, setMapReady] = useState(false);
  const { t } = useTranslation();
  const detections = liveDetections || [];

  const center = useMemo(() => {
    const valid = detections.find(d => d.latitude && d.longitude);
    return valid ? [Number(valid.latitude), Number(valid.longitude)] : [24.0, 25.0];
  }, [detections]);

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalRipe = detections.reduce((sum, d) => sum + (d.ripe || 0), 0);
  const totalUnripe = detections.reduce((sum, d) => sum + (d.unripe || 0), 0);

  return (
    <Card>
      <div style={{ marginBottom: "8px" }}>
        <FarmSelector farms={farms} selectedFarm={selectedFarm} setSelectedFarm={setSelectedFarm} />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", fontSize: "0.8rem", flexWrap: "wrap" }}>
        {[
          { color: "#10B981", label: "≥70% ripe" },
          { color: "#F59E0B", label: "40–70% ripe" },
          { color: "#EF4444", label: "<40% ripe" },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>

      <div style={{ background: "#F0F9FF", padding: "0.5rem", borderRadius: "6px", marginBottom: "0.5rem", fontSize: "0.8rem", color: "#1E40AF" }}>
        {t("map.mapControls")}
      </div>

      <div style={{ height: "380px", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
        <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} whenReady={() => setMapReady(true)}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RecenterMap center={center} />

          {mapReady && detections.length > 0 && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom
              showCoverageOnHover
              zoomToBoundsOnClick
              iconCreateFunction={cluster => new L.DivIcon({
                html: `<div style="background:#10B981;color:white;width:40px;height:40px;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">${cluster.getChildCount()}</div>`,
                className: "cluster-marker",
                iconSize: [40, 40],
              })}
            >
              {detections.filter(d => d.latitude && d.longitude).map((d, i) => {
                const color = getStatusColor(d.ripe || 0, d.unripe || 0);
                return (
                  <Marker key={i} position={[Number(d.latitude), Number(d.longitude)]} icon={createCustomIcon(color)}>
                    <Tooltip>
                      <div style={{ minWidth: "160px", fontSize: "0.85rem" }}>
                        <strong>Detection #{i + 1}</strong><br />
                        🍎 Ripe: <strong>{d.ripe || 0}</strong><br />
                        🍏 Unripe: <strong>{d.unripe || 0}</strong><br />
                        📊 Total: <strong>{d.total_detected || 0}</strong><br />
                        📍 {Number(d.latitude).toFixed(4)}, {Number(d.longitude).toFixed(4)}<br />
                        {d.timestamp && <>⏰ {new Date(d.timestamp).toLocaleString()}</>}
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          )}

          {detections.filter(d => d.latitude && d.longitude).map((d, i) => (
            <Circle
              key={`c-${i}`}
              center={[Number(d.latitude), Number(d.longitude)]}
              radius={50}
              color={getStatusColor(d.ripe || 0, d.unripe || 0)}
              fillColor={getStatusColor(d.ripe || 0, d.unripe || 0)}
              fillOpacity={0.15}
              weight={2}
            />
          ))}
        </MapContainer>
      </div>

      {/* Stats bar */}
      {detections.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.75rem" }}>
          {[
            { label: "Detections", value: detections.length, color: "#6366F1" },
            { label: "Total Fruits", value: totalRipe + totalUnripe, color: "#3B82F6" },
            { label: "Ripe", value: totalRipe, color: "#10B981" },
            { label: "Unripe", value: totalUnripe, color: "#F59E0B" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "0.5rem", textAlign: "center", borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color }}>{value}</div>
              <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "#6B7280", padding: "0.75rem", fontSize: "0.9rem" }}>
          No detection data yet. Upload drone images to see results on the map.
        </div>
      )}
    </Card>
  );
}
