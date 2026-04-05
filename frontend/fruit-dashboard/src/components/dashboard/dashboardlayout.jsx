import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { FaGlobe } from "react-icons/fa";
import api from "../../api/axios";

import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "../../hooks/useTranslation";
import { TopBar, SearchContainer, SearchIcon, SearchBar } from "../shared/styledcomponents";

import DashboardFarmMap from "./DashboardFarmMap";
import WeeklyProgress from "./weeklyprogress";
import FarmSummary from "./farmsummary";
import SummaryPage from "./SummaryPage";
import WeatherForecast from "./WeatherForecast";
import StatsBanner from "./statsbanner";
import HarvestRoutePlanner from "../map/HarvestRoutePlanner";
import HarvestTimeline from "./HarvestTimeline";
import PredictionEngine from "./PredictionEngine";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;
const pulse = keyframes`
  0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; }
`;

const StickyTopBar = styled(TopBar)`
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.97); backdrop-filter: blur(10px);
  border-bottom: 1px solid #f1f5f9; padding: 0.75rem 2rem;
  justify-content: space-between; transition: all 0.3s ease;
`;

const FarmSelectorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6B7280;
`;

const FarmSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1F2937;
  background: white;
  cursor: pointer;
  min-width: 160px;
  transition: border-color 0.2s;
  &:focus { outline: none; border-color: #10B981; }
`;

const AvatarContainer = styled.div`
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white; border-radius: 50%; cursor: pointer;
  font-weight: 600; font-size: 0.95rem; transition: all 0.2s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
`;

const UserDropdown = styled.div`
  position: absolute; right: 0; top: 110%; background: white;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px;
  overflow: hidden; z-index: 1000; border: 1px solid #f1f5f9; min-width: 160px;
`;

const DropdownItem = styled.button`
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  background: none; border: none; text-align: left; padding: 0.75rem 1rem;
  font-size: 0.875rem; cursor: pointer; color: #334155;
  transition: background 0.2s; border-bottom: 1px solid #f8fafc;
  &:hover { background: #f8fafc; color: #10B981; }
  &:last-child { border-bottom: none; color: #ef4444; &:hover { background: #fef2f2; color: #dc2626; } }
`;

const LanguageSelector = styled.div`position: relative; z-index: 10;`;
const LanguageButton = styled.button`
  background: rgba(255,255,255,0.9); border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 0.4rem 0.6rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.82rem; color: #374151; transition: all 0.2s;
  &:hover { background: white; border-color: #3b82f6; }
`;
const LanguageDropdown = styled.div`
  position: absolute; top: 100%; right: 0; margin-top: 0.5rem;
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 120px; overflow: hidden; z-index: 1001;
`;
const LanguageOption = styled.button`
  width: 100%; padding: 0.75rem 1rem; background: none; border: none;
  text-align: left; cursor: pointer; font-size: 0.875rem; color: #374151;
  transition: background-color 0.2s;
  &:hover { background: #f3f4f6; }
  &.active { background: #3b82f6; color: white; }
`;

const MainContent = styled.div`
  padding: ${props => props.activeTab === "map" ? "0" : "1.5rem 2rem"};
  display: flex; flex-direction: column; gap: 1.25rem;
  background: ${props => props.activeTab === "dashboard" ? "#F0F4F8" : "transparent"};
  min-height: calc(100vh - 60px);
  overflow: ${props => props.activeTab === "map" ? "hidden" : "visible"};
`;

const ContentSection = styled.div`animation: ${fadeIn} 0.5s ease;`;

const LoadingSkeleton = styled.div`
  background: white; border-radius: 12px; padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-align: center;
`;
const SkeletonShimmer = styled.div`
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%; animation: ${pulse} 2s infinite;
  border-radius: 8px; height: 20px; margin-bottom: 1rem;
  &:last-child { margin-bottom: 0; }
`;

const NoFarmContainer = styled.div`
  width: 100%; background: white; border-radius: 14px; padding: 3rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-align: center;
`;

const MapSummaryGrid = styled.div`
  display: flex; flex-direction: row; gap: 1.25rem; width: 100%; align-items: flex-start;
  @media (max-width: 1024px) { flex-direction: column; }
`;

const MapContainer = styled.div`
  flex: 2; background: white; border-radius: 14px; padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); min-height: 400px;
`;

const SummaryContainer = styled.div`
  flex: 1; background: white; border-radius: 14px; padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); min-height: 400px;
`;

const SectionTitle = styled.h2`
  color: #065F46; margin-bottom: 1rem; font-weight: 600; font-size: 1.1rem;
`;

const CardContainer = styled.div`
  background: white; border-radius: 14px; padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); width: 100%;
`;

const FullPageMapContainer = styled.div`
  width: 100%; height: calc(100vh - 60px); background: white;
  overflow: hidden; position: relative;
`;

const HarvestPredictionSkeleton = () => (
  <LoadingSkeleton>
    <SkeletonShimmer style={{ height: "28px", width: "50%", margin: "0 auto 1rem" }} />
    <SkeletonShimmer style={{ height: "14px", width: "75%", margin: "0 auto 0.5rem" }} />
    <SkeletonShimmer style={{ height: "14px", width: "60%", margin: "0 auto 0.5rem" }} />
  </LoadingSkeleton>
);

export default function DashboardLayout({ activeTab, selectedFarm, farms, setSelectedFarm, loading }) {
  const [detections, setDetections] = useState([]);
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [harvestPrediction, setHarvestPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const summaryFetched = useRef(false);
  const token = localStorage.getItem("token");
  const farmId = selectedFarm?.id ?? null;

  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const filteredFarms = farms.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  // Fetch summary once
  useEffect(() => {
    if (summaryFetched.current) return;
    summaryFetched.current = true;
    api.get("/summary", { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
      .then(res => setSummaryData(res.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line

  // Fetch harvest prediction when farm changes
  useEffect(() => {
    if (!farmId) { setHarvestPrediction(null); return; }
    setPredictionLoading(true);
    const timer = setTimeout(() => {
      api.get(`/detections/${farmId}/harvest-timeline`, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 8000,
      })
        .then(res => setHarvestPrediction(res.data))
        .catch(() => setHarvestPrediction(null))
        .finally(() => setPredictionLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [farmId]); // eslint-disable-line

  // Fetch detections when farm changes
  useEffect(() => {
    if (!farmId) { setDetections([]); return; }
    const timer = setTimeout(() => {
      api.get(`/detections/farm/${farmId}`, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 8000,
      })
        .then(res => setDetections(res.data || []))
        .catch(() => setDetections([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [farmId]); // eslint-disable-line

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

  return (
    <>
      <StickyTopBar>
        {/* Left: search */}
        <SearchContainer style={{ flex: 1, maxWidth: "320px" }}>
          <SearchIcon />
          <SearchBar
            placeholder={t("dashboard.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchContainer>

        {/* Center: farm selector */}
        <FarmSelectorWrapper>
          <span>🌾</span>
          <FarmSelect
            value={selectedFarm?.id || ""}
            onChange={e => {
              const farm = farms.find(f => f.id === Number(e.target.value));
              if (farm) setSelectedFarm(farm);
            }}
          >
            <option value="" disabled>Select farm...</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </FarmSelect>
        </FarmSelectorWrapper>

        {/* Right: language + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <LanguageSelector>
            <LanguageButton onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}>
              <FaGlobe /> {language === "en" ? "EN" : "中文"}
            </LanguageButton>
            {showLanguageDropdown && (
              <LanguageDropdown>
                <LanguageOption onClick={() => handleLanguageChange("en")} className={language === "en" ? "active" : ""}>English</LanguageOption>
                <LanguageOption onClick={() => handleLanguageChange("zh")} className={language === "zh" ? "active" : ""}>中文</LanguageOption>
              </LanguageDropdown>
            )}
          </LanguageSelector>

          <div style={{ position: "relative" }}>
            <AvatarContainer onClick={() => setShowUserMenu(!showUserMenu)}>F</AvatarContainer>
            {showUserMenu && (
              <UserDropdown>
                <DropdownItem>👤 {t("nav.profile")}</DropdownItem>
                <DropdownItem>⚙️ {t("nav.settings")}</DropdownItem>
                <DropdownItem onClick={handleLogout}>🚪 {t("nav.logout")}</DropdownItem>
              </UserDropdown>
            )}
          </div>
        </div>
      </StickyTopBar>

      {(showLanguageDropdown || showUserMenu) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => { setShowLanguageDropdown(false); setShowUserMenu(false); }} />
      )}

      <MainContent activeTab={activeTab}>
        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && (
          <>
            {!selectedFarm ? (
              <ContentSection>
                <StatsBanner user="Farmer" detections={[]} />
                <NoFarmContainer>
                  <p style={{ color: "#6B7280", fontSize: "1rem", margin: 0 }}>
                    🌾 Select a farm from the dropdown above to view analytics.
                  </p>
                </NoFarmContainer>
                {summaryData.length > 0 && (
                  <CardContainer>
                    <SectionTitle>{t("dashboard.weatherForecast")}</SectionTitle>
                    <WeatherForecast summaryData={summaryData} />
                  </CardContainer>
                )}
              </ContentSection>
            ) : (
              <ContentSection>
                {/* 1. Stats Banner */}
                <StatsBanner user="Farmer" detections={detections} />

                {/* 2. Harvest Prediction from backend */}
                {predictionLoading ? (
                  <HarvestPredictionSkeleton />
                ) : (
                  <PredictionEngine
                    harvestPrediction={harvestPrediction}
                    detections={detections}
                  />
                )}

                {/* 3. Harvest Timeline (detailed view) */}
                {harvestPrediction && <HarvestTimeline prediction={harvestPrediction} />}

                {/* 4. Map + Farm Summary side by side */}
                <MapSummaryGrid>
                  <MapContainer>
                    <SectionTitle>🗺️ {selectedFarm.name} — Detection Map</SectionTitle>
                    <DashboardFarmMap
                      selectedFarm={selectedFarm}
                      farms={filteredFarms}
                      setSelectedFarm={setSelectedFarm}
                      loading={loading}
                      detections={detections}
                    />
                  </MapContainer>
                  <SummaryContainer>
                    <SectionTitle>Farm Summary</SectionTitle>
                    <FarmSummary selectedFarm={selectedFarm} detections={detections} />
                  </SummaryContainer>
                </MapSummaryGrid>

                {/* 5. Detection History Chart */}
                <CardContainer>
                  <SectionTitle>📈 Detection History</SectionTitle>
                  <WeeklyProgress selectedFarm={selectedFarm} detections={detections} />
                </CardContainer>

                {/* 6. Weather */}
                {summaryData.length > 0 && (
                  <CardContainer>
                    <SectionTitle>{t("dashboard.fiveDayForecast")}</SectionTitle>
                    <WeatherForecast summaryData={summaryData} selectedFarmId={selectedFarm.id} />
                  </CardContainer>
                )}
              </ContentSection>
            )}
          </>
        )}

        {/* ── SUMMARY TAB ── */}
        {activeTab === "summary" && (
          <div style={{ width: "100%", padding: "0.5rem 0" }}>
            <SummaryPage token={token} />
          </div>
        )}

        {/* ── MAP TAB ── */}
        {activeTab === "map" && (
          <FullPageMapContainer>
            <HarvestRoutePlanner
              selectedFarm={selectedFarm}
              detections={detections}
              farms={farms}
              setSelectedFarm={setSelectedFarm}
            />
          </FullPageMapContainer>
        )}
      </MainContent>
    </>
  );
}
