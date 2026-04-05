import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Card, FormControl,
  InputLabel, Select, MenuItem, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, CircularProgress
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from "../../api/axios";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Recenter map when center changes
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center, map]);
  return null;
}

const createCustomIcon = (color, emoji, size = 32) => new L.DivIcon({
  html: `<div style="background-color:${color};width:${size}px;height:${size}px;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${size * 0.4}px;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
  className: 'custom-marker',
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

const getMarkerInfo = (detection) => {
  const total = (detection.ripe || 0) + (detection.unripe || 0);
  if (total === 0) return { color: '#6B7280', emoji: '❓' };
  const pct = (detection.ripe / total) * 100;
  if (pct >= 70) return { color: '#10B981', emoji: '🍎' };
  if (pct >= 30) return { color: '#F59E0B', emoji: '🍊' };
  return { color: '#EF4444', emoji: '🍏' };
};

const groupByDate = (detections) => {
  const groups = {};
  detections.forEach(d => {
    const date = new Date(d.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(d);
  });
  return groups;
};

const generateRoute = (detections) => {
  const ripeSpots = detections
    .filter(d => d.ripe > 0 && d.latitude && d.longitude)
    .sort((a, b) => (b.ripe / (b.ripe + b.unripe)) - (a.ripe / (a.ripe + a.unripe)))
    .slice(0, 8);
  return ripeSpots.map(d => [Number(d.latitude), Number(d.longitude)]);
};

// Inspection Dialog
const InspectionDialog = ({ open, onClose, detection, fruits, loading }) => {
  const [tab, setTab] = useState(0);
  if (!detection) return null;
  const total = (detection.ripe || 0) + (detection.unripe || 0);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>🍎 Fruit Inspection — Spot #{detection.id}</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Individual Fruits" />
          <Tab label="Spot Summary" />
        </Tabs>
        {tab === 0 && (
          loading ? (
            <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
          ) : fruits?.length > 0 ? (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Grid container spacing={1}>
                {fruits.map(f => (
                  <Grid item xs={12} sm={6} key={f.id}>
                    <Card variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2">🍎 Fruit #{f.id}</Typography>
                      <Typography variant="body2">Type: {f.fruit_type}</Typography>
                      <Typography variant="body2">Confidence: {(f.confidence * 100).toFixed(1)}%</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={3}>No individual fruit data available</Typography>
          )
        )}
        {tab === 1 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                  <Typography variant="h4" color="success.main">{detection.ripe || 0}</Typography>
                  <Typography variant="body2" color="success.main">Ripe Fruits</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fffbeb' }}>
                  <Typography variant="h4" color="warning.main">{detection.unripe || 0}</Typography>
                  <Typography variant="body2" color="warning.main">Unripe Fruits</Typography>
                </Card>
              </Grid>
            </Grid>
            <Typography variant="body2"><strong>Ripeness Rate:</strong> {total > 0 ? ((detection.ripe / total) * 100).toFixed(1) : 0}%</Typography>
            <Typography variant="body2"><strong>Detection Time:</strong> {new Date(detection.timestamp).toLocaleString()}</Typography>
            <Typography variant="body2"><strong>GPS:</strong> {Number(detection.latitude).toFixed(5)}, {Number(detection.longitude).toFixed(5)}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default function HarvestRoutePlanner({ selectedFarm, detections = [], farms, setSelectedFarm }) {
  const [walkingRoute, setWalkingRoute] = useState([]);
  const [routeType, setRouteType] = useState('quick');
  const [selectedDate, setSelectedDate] = useState('');
  const [inspection, setInspection] = useState({ open: false, detection: null, fruits: null, loading: false });

  const dateGroups = useMemo(() => groupByDate(detections), [detections]);
  const availableDates = useMemo(() => Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a)), [dateGroups]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) setSelectedDate(availableDates[0]);
  }, [availableDates]); // eslint-disable-line

  const dateDetections = useMemo(() => selectedDate ? dateGroups[selectedDate] || [] : detections, [selectedDate, dateGroups, detections]);

  const filteredDetections = useMemo(() => {
    const valid = dateDetections.filter(d => d.latitude && d.longitude);
    if (routeType === 'fullHarvest') return valid.filter(d => d.ripe > 0);
    if (routeType === 'ripe-only') return valid.filter(d => d.unripe > 0 && d.ripe === 0);
    return valid;
  }, [dateDetections, routeType]);

  // Dynamic center from detections
  const mapCenter = useMemo(() => {
    const valid = filteredDetections.find(d => d.latitude && d.longitude);
    if (valid) return [Number(valid.latitude), Number(valid.longitude)];
    return [24.0, 25.0];
  }, [filteredDetections]);

  const walkingStats = useMemo(() => {
    if (walkingRoute.length < 2) return null;
    let meters = 0;
    for (let i = 1; i < walkingRoute.length; i++) {
      const [lat1, lng1] = walkingRoute[i - 1];
      const [lat2, lng2] = walkingRoute[i];
      const dlat = (lat2 - lat1) * 111320;
      const dlng = (lng2 - lng1) * 111320 * Math.cos((lat1 + lat2) * Math.PI / 360);
      meters += Math.sqrt(dlat * dlat + dlng * dlng);
    }
    return {
      distance: meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`,
      time: `${Math.ceil((meters / 80) / 60)} min`,
      stops: walkingRoute.length,
      ripeSpots: dateDetections.filter(d => d.ripe > 0).length,
    };
  }, [walkingRoute, dateDetections]);

  const handleDetectionClick = async (detection) => {
    setInspection({ open: true, detection, fruits: null, loading: true });
    try {
      const res = await api.get(`/detections/individual-fruits/${detection.id}`);
      setInspection(prev => ({ ...prev, fruits: res.data.individual_fruits, loading: false }));
    } catch {
      setInspection(prev => ({ ...prev, loading: false }));
    }
  };

  const totalRipe = dateDetections.reduce((s, d) => s + (d.ripe || 0), 0);
  const totalUnripe = dateDetections.reduce((s, d) => s + (d.unripe || 0), 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}>
      {/* Header */}
      <Card sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>🗺️ Farm Map</Typography>
            <Typography variant="body2" color="text.secondary">
              {detections.length} total detections • {filteredDetections.length} showing
            </Typography>
          </Box>
          {farms && setSelectedFarm && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Select Farm</InputLabel>
              <Select
                value={selectedFarm?.id || ''}
                label="Select Farm"
                onChange={e => setSelectedFarm(farms.find(f => f.id === e.target.value))}
              >
                {farms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Box>
      </Card>

      <Box sx={{ display: 'flex', gap: 1, flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <Box sx={{ width: 260, display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>

          {/* Date */}
          <Card sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Flight Date</Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Select Date</InputLabel>
              <Select value={selectedDate} label="Select Date" onChange={e => setSelectedDate(e.target.value)}>
                {availableDates.map(date => (
                  <MenuItem key={date} value={date}>
                    {date} ({dateGroups[date]?.length || 0} detections)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>

          {/* Filter */}
          <Card sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Filter</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>View Type</InputLabel>
              <Select value={routeType} label="View Type" onChange={e => setRouteType(e.target.value)}>
                <MenuItem value="quick">All Fruits</MenuItem>
                <MenuItem value="fullHarvest">Ripe Only</MenuItem>
                <MenuItem value="ripe-only">Unripe Only</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" fullWidth size="small" onClick={() => setWalkingRoute(generateRoute(filteredDetections))}>
              🔄 Generate Route
            </Button>
          </Card>

          {/* Stats */}
          <Card sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Farm Status</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <Chip label={`${dateDetections.length} spots`} size="small" color="primary" />
              <Chip label={`${dateDetections.filter(d => d.ripe > 0).length} ready`} size="small" color="success" />
            </Box>
            <Grid container spacing={1}>
              {[
                { label: '🍎 Ripe', value: totalRipe, color: '#10B981' },
                { label: '🍏 Unripe', value: totalUnripe, color: '#F59E0B' },
              ].map(({ label, value, color }) => (
                <Grid item xs={6} key={label}>
                  <Box sx={{ textAlign: 'center', p: 0.5, borderRadius: 1, border: `1px solid ${color}20`, bgcolor: `${color}10` }}>
                    <Typography variant="h6" sx={{ color, fontWeight: 700 }}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* Route Stats */}
          {walkingStats && (
            <Card sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Route Summary</Typography>
              <Grid container spacing={1}>
                {[
                  { label: 'Distance', value: walkingStats.distance },
                  { label: 'Est. Time', value: walkingStats.time },
                  { label: 'Stops', value: walkingStats.stops },
                  { label: 'Ripe Spots', value: walkingStats.ripeSpots },
                ].map(({ label, value }) => (
                  <Grid item xs={6} key={label}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={600}>{value}</Typography>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}

          {/* Actions */}
          <Card sx={{ p: 1.5 }}>
            <Button variant="outlined" fullWidth size="small" color="error" onClick={() => setWalkingRoute([])}>
              🧹 Clear Route
            </Button>
          </Card>
        </Box>

        {/* Map */}
        <Paper sx={{ flex: 1, borderRadius: 1, overflow: 'hidden' }}>
          {filteredDetections.length === 0 ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, color: 'text.secondary' }}>
              <Typography variant="h6">No detections to show</Typography>
              <Typography variant="body2">Upload drone images to see detection points on the map</Typography>
            </Box>
          ) : (
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <RecenterMap center={mapCenter} />

              {filteredDetections.map(d => {
                const { color, emoji } = getMarkerInfo(d);
                const total = (d.ripe || 0) + (d.unripe || 0);
                const pct = total > 0 ? Math.round((d.ripe / total) * 100) : 0;
                return (
                  <Marker
                    key={d.id}
                    position={[Number(d.latitude), Number(d.longitude)]}
                    icon={createCustomIcon(color, emoji, 28)}
                    eventHandlers={{ click: () => handleDetectionClick(d) }}
                  >
                    <Tooltip>
                      <div style={{ minWidth: 180, fontSize: '0.85rem' }}>
                        <strong>Spot #{d.id}</strong><br />
                        {emoji} {pct}% ripe<br />
                        🍎 {d.ripe || 0} ripe • 🍏 {d.unripe || 0} unripe<br />
                        📍 {Number(d.latitude).toFixed(4)}, {Number(d.longitude).toFixed(4)}<br />
                        ⏰ {new Date(d.timestamp).toLocaleString()}<br />
                        <em style={{ color: '#6B7280' }}>Click for details</em>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}

              {walkingRoute.length > 1 && (
                <Polyline positions={walkingRoute} color="#8B5CF6" weight={4} opacity={0.8} dashArray="8,4" />
              )}
            </MapContainer>
          )}
        </Paper>
      </Box>

      <InspectionDialog
        open={inspection.open}
        onClose={() => setInspection({ open: false, detection: null, fruits: null, loading: false })}
        detection={inspection.detection}
        fruits={inspection.fruits}
        loading={inspection.loading}
      />
    </Box>
  );
}
