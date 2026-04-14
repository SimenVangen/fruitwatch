import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createIcon = (color) => new L.DivIcon({
  html: `<div style="background:${color};width:18px;height:18px;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`,
  className: "custom-marker",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const getMarkerColor = (d, isDiseaseFarm) => {
  if (isDiseaseFarm) {
    if (d.is_healthy === "True"  || d.is_healthy === true)  return "#10B981";
    if (d.is_healthy === "False" || d.is_healthy === false) return "#EF4444";
    return "#6B7280";
  }
  const total = (d.ripe || 0) + (d.unripe || 0);
  if (total === 0) return "#6B7280";
  const pct = (d.ripe / total) * 100;
  if (pct >= 70) return "#10B981";
  if (pct >= 40) return "#F59E0B";
  return "#EF4444";
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 14); }, [center, map]);
  return null;
}

export default function DashboardFarmMap({ selectedFarm, farms, setSelectedFarm, detections: raw, farmType }) {
  const [mapReady, setMapReady] = useState(false);
  const detections    = raw || [];
  const isDiseaseFarm = farmType === "plant_disease_only";

  const center = useMemo(() => {
    const v = detections.find(d => d.latitude && d.longitude);
    return v ? [Number(v.latitude), Number(v.longitude)] : [24.0, 25.0];
  }, [detections]);

  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const legend = isDiseaseFarm
    ? [
        { color: "#10B981", label: "Healthy plant" },
        { color: "#EF4444", label: "Diseased plant" },
        { color: "#6B7280", label: "Unknown" },
      ]
    : [
        { color: "#10B981", label: "≥70% ripe" },
        { color: "#F59E0B", label: "40–70% ripe" },
        { color: "#EF4444", label: "<40% ripe" },
      ];

  const totalRipe     = detections.reduce((s,d) => s + (d.ripe   || 0), 0);
  const totalUnripe   = detections.reduce((s,d) => s + (d.unripe || 0), 0);
  const healthyCount  = detections.filter(d => d.is_healthy === "True"  || d.is_healthy === true).length;
  const diseasedCount = detections.filter(d => d.is_healthy === "False" || d.is_healthy === false).length;

  const statsBar = isDiseaseFarm
    ? [
        { label: "Scans",    value: detections.length, color: "#6366F1" },
        { label: "Healthy",  value: healthyCount,      color: "#10B981" },
        { label: "Diseased", value: diseasedCount,     color: "#EF4444" },
      ]
    : [
        { label: "Scans",  value: detections.length, color: "#6366F1" },
        { label: "Ripe",   value: totalRipe,          color: "#10B981" },
        { label: "Unripe", value: totalUnripe,        color: "#F59E0B" },
      ];

  return (
    <div>
      {/* Legend */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
        {legend.map(({ color, label }) => (
          <span key={label} style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"0.78rem", color:"#6B7280" }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }}/>
            {label}
          </span>
        ))}
      </div>

      {/* Map */}
      <div style={{ height:"400px", width:"100%", borderRadius:"10px", overflow:"hidden" }}>
        <MapContainer center={center} zoom={14} style={{ height:"100%", width:"100%" }} whenReady={() => setMapReady(true)}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RecenterMap center={center}/>

          {mapReady && detections.length > 0 && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom
              showCoverageOnHover
              zoomToBoundsOnClick
              iconCreateFunction={cluster => new L.DivIcon({
                html: `<div style="background:#10B981;color:white;width:36px;height:36px;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.8rem;">${cluster.getChildCount()}</div>`,
                className: "cluster-marker",
                iconSize: [36, 36],
              })}
            >
              {detections.filter(d => d.latitude && d.longitude).map((d, i) => (
                <Marker
                  key={i}
                  position={[Number(d.latitude), Number(d.longitude)]}
                  icon={createIcon(getMarkerColor(d, isDiseaseFarm))}
                >
                  <Tooltip>
                    <div style={{ fontSize:"0.82rem", lineHeight:"1.5" }}>
                      <strong>Detection #{i + 1}</strong><br/>
                      {isDiseaseFarm ? (
                        <>
                          🌿 {d.plant_type || "Plant"}<br/>
                          {d.is_healthy === "True" || d.is_healthy === true
                            ? "✅ Healthy"
                            : `⚠️ ${(d.disease_type || "Unknown").replace(/_/g, " ")}`}
                        </>
                      ) : (
                        <>
                          🍈 Ripe: <strong>{d.ripe || 0}</strong><br/>
                          🍏 Unripe: <strong>{d.unripe || 0}</strong>
                        </>
                      )}
                      <br/>
                      📍 {Number(d.latitude).toFixed(4)}, {Number(d.longitude).toFixed(4)}<br/>
                      {d.timestamp && <>⏰ {new Date(d.timestamp).toLocaleString()}</>}
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {detections.filter(d => d.latitude && d.longitude).map((d, i) => (
            <Circle
              key={`c-${i}`}
              center={[Number(d.latitude), Number(d.longitude)]}
              radius={50}
              color={getMarkerColor(d, isDiseaseFarm)}
              fillColor={getMarkerColor(d, isDiseaseFarm)}
              fillOpacity={0.12}
              weight={1.5}
            />
          ))}
        </MapContainer>
      </div>

      {/* Bottom stat strip */}
      {detections.length === 0 ? (
        <p style={{ textAlign:"center", color:"#9CA3AF", fontSize:"0.85rem", margin:"0.75rem 0 0" }}>
          No detections yet — data will appear here once your drone sends images.
        </p>
      ) : (
        <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.75rem" }}>
          {statsBar.map(({ label, value, color }) => (
            <div key={label} style={{
              flex:1, background:"#F8FAFC", borderRadius:"8px",
              padding:"0.4rem 0.5rem", textAlign:"center",
              borderLeft:`3px solid ${color}`
            }}>
              <div style={{ fontSize:"1rem", fontWeight:"700", color }}>{value}</div>
              <div style={{ fontSize:"0.68rem", color:"#9CA3AF" }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
