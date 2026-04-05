import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import FloatingPanel from "../dashboard/FloatingPanel";
import PriorityPanel from "../dashboard/PriorityPanel";
import ThreeDFarmView from "./ThreeDFarmView"; // Import your 3D component

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [33.123, 30.245];
const DEFAULT_ZOOM = 10;

export default function ExplorerMap({ farms = [], selectedFarm, setSelectedFarm, detections = [] }) {
  const [activePanels, setActivePanels] = useState({
    priorities: true,
    weather: true,
    suggestions: true
  });
  const [viewMode, setViewMode] = useState('3d'); // '2d' or '3d'

  // Mock data for map page
  const mapPagePriorities = [
    {
      priority: 'urgent',
      title: 'Harvest Sunshine Orchard',
      description: '85% ripe • Optimal conditions today',
      action: 'viewHarvest',
      actionLabel: 'Schedule'
    },
    {
      priority: 'attention',
      title: 'Check Valley Farms Irrigation', 
      description: 'System pressure low • 3 fields affected',
      action: 'checkIrrigation',
      actionLabel: 'Inspect'
    }
  ];

  const handlePanelAction = (action, data) => {
    console.log('Map page action:', action, data);
  };

  // Render the appropriate view based on mode
  const renderMapView = () => {
    if (viewMode === '3d') {
      return (
        <ThreeDFarmView 
          farms={farms}
          selectedFarm={selectedFarm}
          detections={detections}
          onObjectClick={(data) => console.log('3D object clicked:', data)}
        />
      );
    } else {
      return (
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* All farms as interactive markers */}
          {farms.map((farm) => {
            if (!farm.latitude || !farm.longitude) return null;
            
            const isSelected = selectedFarm?.id === farm.id;
            
            return (
              <Marker 
                key={farm.id}
                position={[Number(farm.latitude), Number(farm.longitude)]}
                eventHandlers={{
                  click: () => setSelectedFarm(farm),
                }}
              >
                <Tooltip permanent={isSelected}>
                  <div style={{ textAlign: 'center' }}>
                    <strong>🌾 {farm.name}</strong>
                    {isSelected && <div>⭐ Selected</div>}
                    {farm.total_ripe && (
                      <div>🍎 {farm.total_ripe} ripe</div>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      );
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* View Mode Toggle */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(255,255,255,0.9)',
        padding: '0.75rem',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <button 
          onClick={() => setViewMode('2d')}
          style={{
            background: viewMode === '2d' ? '#3B82F6' : '#6B7280',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🗺️ 2D Map
        </button>
        <button 
          onClick={() => setViewMode('3d')}
          style={{
            background: viewMode === '3d' ? '#10B981' : '#6B7280',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🌐 3D View
        </button>
      </div>

      {/* Render Map View (2D or 3D) */}
      {renderMapView()}

      {/* Floating Panels - Show on both 2D and 3D views */}
      {activePanels.priorities && (
        <PriorityPanel 
          priorities={mapPagePriorities}
          onAction={handlePanelAction}
          onClose={() => setActivePanels(prev => ({ ...prev, priorities: false }))}
        />
      )}

      {activePanels.weather && (
        <FloatingPanel 
          title="🌤️ Regional Weather" 
          position="top-left"
          onClose={() => setActivePanels(prev => ({ ...prev, weather: false }))}
        >
          <div style={{ lineHeight: '1.4' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>All Regions:</strong><br/>
              ✅ Good harvesting conditions<br/>
              ⚠️ Rain expected in North
            </div>
            <div style={{ 
              background: '#F0F9FF', 
              padding: '0.5rem',
              borderRadius: '4px'
            }}>
              <strong>Recommendation:</strong><br/>
              "Focus on Southern farms today"
            </div>
          </div>
        </FloatingPanel>
      )}

      {/* Controls Panel */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(255,255,255,0.9)',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {viewMode === '3d' ? '3D Controls' : 'Map Tools'}
        </div>
        <button 
          onClick={() => setActivePanels(prev => ({ ...prev, priorities: !prev.priorities }))}
          style={{
            background: activePanels.priorities ? '#10B981' : '#6B7280',
            color: 'white',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🚨 Priorities
        </button>
        <button 
          onClick={() => setActivePanels(prev => ({ ...prev, weather: !prev.weather }))}
          style={{
            background: activePanels.weather ? '#3B82F6' : '#6B7280',
            color: 'white', 
            border: 'none',
            padding: '0.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🌤️ Weather
        </button>
      </div>
    </div>
  );
}