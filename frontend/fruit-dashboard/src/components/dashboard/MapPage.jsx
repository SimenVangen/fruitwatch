import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Paper, Alert, Grid } from "@mui/material";
import HarvestRoutePlanner from "../map/HarvestRoutePlanner";
import api from "../../api/axios";

export default function MapPage({ farms, selectedFarm, setSelectedFarm }) {
  const [detections, setDetections] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (farms?.length > 0 && !selectedFarm) setSelectedFarm(farms[0]);
  }, [farms, selectedFarm, setSelectedFarm]);

  useEffect(() => {
    if (!selectedFarm) return;
    api.get(`/detections/farm/${selectedFarm.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDetections(res.data || []))
      .catch(() => setDetections([]));
  }, [selectedFarm, token]);

  useEffect(() => {
    if (!detections.length) return;
    const totalRipe = detections.reduce((sum, d) => sum + (d.ripe || 0), 0);
    const totalUnripe = detections.reduce((sum, d) => sum + (d.unripe || 0), 0);
    const readyForHarvest = detections.filter(d => {
      const total = (d.ripe || 0) + (d.unripe || 0);
      return total > 0 && d.ripe / total >= 0.7;
    }).length;
    setRouteStats({
      totalDetections: detections.length,
      totalRipe,
      totalUnripe,
      readyForHarvest,
      overallRipeness: totalRipe + totalUnripe > 0
        ? Math.round((totalRipe / (totalRipe + totalUnripe)) * 100) : 0,
    });
  }, [detections]);

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">🗺️ Harvest Route Planner</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Plan optimal harvest routes based on drone detection data.
          {selectedFarm && ` Currently viewing: ${selectedFarm.name}`}
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>How to use:</strong> Click detection points to select them, or use the optimization tools to generate the most efficient harvest route.
        </Alert>
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Paper sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
          <HarvestRoutePlanner
            selectedFarm={selectedFarm}
            detections={detections}
            farms={farms}
            setSelectedFarm={setSelectedFarm}
          />
        </Paper>
      </Box>

      {routeStats && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {[
              { label: "Detection Points", value: routeStats.totalDetections, color: "primary" },
              { label: "Ready for Harvest", value: routeStats.readyForHarvest, color: "success" },
              { label: "Ripe Fruits", value: routeStats.totalRipe, color: "warning" },
              { label: "Unripe Fruits", value: routeStats.totalUnripe, color: "info" },
              { label: "Overall Ripeness", value: `${routeStats.overallRipeness}%`, color: "secondary" },
            ].map(({ label, value, color }) => (
              <Grid item xs={12} sm={6} md={2.4} key={label}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: `${color}.50` }}>
                  <Typography variant="h6" color={`${color}.main`} fontWeight="bold">{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}
