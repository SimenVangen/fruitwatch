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
import SensorWidget from "./SensorWidget";

const fadeIn  = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const pulse   = keyframes`0%{opacity:1}50%{opacity:0.4}100%{opacity:1}`;

const StickyTopBar = styled(TopBar)`
  position:sticky;top:0;z-index:100;
  background:rgba(255,255,255,0.97);backdrop-filter:blur(10px);
  border-bottom:1px solid #f1f5f9;padding:0.75rem 2rem;
  justify-content:space-between;transition:all 0.3s ease;
`;
const FarmSelectorWrapper = styled.div`display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:#6B7280;`;
const FarmSelect = styled.select`
  padding:0.5rem 0.75rem;border:1.5px solid #E2E8F0;border-radius:8px;
  font-size:0.875rem;color:#1F2937;background:white;cursor:pointer;min-width:160px;
  transition:border-color 0.2s;&:focus{outline:none;border-color:#10B981;}
`;
const Avatar = styled.div`
  display:flex;align-items:center;justify-content:center;
  width:36px;height:36px;background:linear-gradient(135deg,#10B981,#059669);
  color:white;border-radius:50%;cursor:pointer;font-weight:600;font-size:0.95rem;
  transition:all 0.2s;&:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,0.3);}
`;
const UserDropdown = styled.div`
  position:absolute;right:0;top:110%;background:white;
  box-shadow:0 10px 25px rgba(0,0,0,0.1);border-radius:12px;
  overflow:hidden;z-index:1000;border:1px solid #f1f5f9;min-width:160px;
`;
const DropdownItem = styled.button`
  display:flex;align-items:center;gap:0.5rem;width:100%;
  background:none;border:none;text-align:left;padding:0.75rem 1rem;
  font-size:0.875rem;cursor:pointer;color:#334155;
  transition:background 0.2s;border-bottom:1px solid #f8fafc;
  &:hover{background:#f8fafc;color:#10B981;}
  &:last-child{border-bottom:none;color:#ef4444;&:hover{background:#fef2f2;color:#dc2626;}}
`;
const LangBtn = styled.button`
  background:rgba(255,255,255,0.9);border:1px solid #e5e7eb;border-radius:8px;
  padding:0.4rem 0.6rem;cursor:pointer;display:flex;align-items:center;gap:0.4rem;
  font-size:0.82rem;color:#374151;transition:all 0.2s;
  &:hover{background:white;border-color:#3b82f6;}
`;
const LangDropdown = styled.div`
  position:absolute;top:100%;right:0;margin-top:0.5rem;background:white;
  border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);
  min-width:120px;overflow:hidden;z-index:1001;
`;
const LangOption = styled.button`
  width:100%;padding:0.75rem 1rem;background:none;border:none;
  text-align:left;cursor:pointer;font-size:0.875rem;color:#374151;
  transition:background-color 0.2s;&:hover{background:#f3f4f6;}
  &.active{background:#3b82f6;color:white;}
`;
const Main = styled.div`
  padding:${p=>p.ismap?"0":"1.5rem 2rem"};
  display:flex;flex-direction:column;gap:1.25rem;
  background:${p=>p.ismap?"transparent":"#F0F4F8"};
  min-height:calc(100vh - 60px);
  overflow:${p=>p.ismap?"hidden":"visible"};
`;
const Section  = styled.div`animation:${fadeIn} 0.45s ease;`;
const Card2    = styled.div`background:white;border-radius:14px;padding:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.06);width:100%;`;
const Title    = styled.h2`color:#065F46;margin:0 0 1rem;font-weight:600;font-size:1rem;`;
const Grid     = styled.div`display:flex;flex-direction:row;gap:1.25rem;width:100%;align-items:flex-start;@media(max-width:1024px){flex-direction:column;}`;
const MapWrap  = styled.div`flex:2;background:white;border-radius:14px;padding:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.06);`;
const SumWrap  = styled.div`flex:1;background:white;border-radius:14px;padding:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.06);`;
const FullMap  = styled.div`width:100%;height:calc(100vh - 60px);background:white;overflow:hidden;position:relative;`;
const NoFarm   = styled.div`width:100%;background:white;border-radius:14px;padding:3rem;box-shadow:0 4px 16px rgba(0,0,0,0.06);text-align:center;`;
const Skeleton = styled.div`background:white;border-radius:12px;padding:2rem;box-shadow:0 4px 16px rgba(0,0,0,0.06);text-align:center;`;
const Shimmer  = styled.div`
  background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
  background-size:200% 100%;animation:${pulse} 2s infinite;
  border-radius:8px;height:20px;margin-bottom:1rem;&:last-child{margin-bottom:0;}
`;
const FarmTypeBadge = styled.div`
  display:inline-flex;align-items:center;gap:0.35rem;
  padding:0.2rem 0.6rem;border-radius:20px;font-size:0.72rem;font-weight:600;
  background:${p=>p.isDisease?"#FEF3C7":"#D1FAE5"};
  color:${p=>p.isDisease?"#92400E":"#065F46"};
  border:1px solid ${p=>p.isDisease?"#FDE68A":"#A7F3D0"};
`;
const WelcomeStrip = styled.div`
  background:white;border-radius:14px;padding:1.25rem 1.5rem;
  box-shadow:0 4px 16px rgba(0,0,0,0.06);
  display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;
`;
const StatPill = styled.div`
  display:flex;flex-direction:column;align-items:center;
  background:#F8FAFC;border-radius:10px;padding:0.6rem 1.1rem;
  border-left:3px solid ${p=>p.color};min-width:80px;
`;

export default function DashboardLayout({ activeTab, selectedFarm, farms, setSelectedFarm, loading }) {
  const [detections,        setDetections]        = useState([]);
  const [showUserMenu,      setShowUserMenu]       = useState(false);
  const [summaryData,       setSummaryData]        = useState([]);
  const [harvestPrediction, setHarvestPrediction]  = useState(null);
  const [predictionLoading, setPredictionLoading]  = useState(false);
  const [showLang,          setShowLang]           = useState(false);
  const [search,            setSearch]             = useState("");

  const summaryFetched = useRef(false);
  const token  = localStorage.getItem("token");
  const farmId = selectedFarm?.id ?? null;

  const farmType      = selectedFarm?.farm_type || "lychee";
  const isDiseaseFarm = farmType === "plant_disease_only";

  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const filteredFarms = farms.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (summaryFetched.current) return;
    summaryFetched.current = true;
    api.get("/summary", { headers:{ Authorization:`Bearer ${token}` }, timeout:10000 })
      .then(r => setSummaryData(r.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!farmId) { setHarvestPrediction(null); return; }
    if (isDiseaseFarm) return;
    setPredictionLoading(true);
    const tid = setTimeout(() => {
      api.get(`/detections/${farmId}/harvest-timeline`, {
        headers:{ Authorization:`Bearer ${token}` }, timeout:8000,
      })
        .then(r => setHarvestPrediction(r.data))
        .catch(() => setHarvestPrediction(null))
        .finally(() => setPredictionLoading(false));
    }, 500);
    return () => clearTimeout(tid);
  }, [farmId, isDiseaseFarm]); // eslint-disable-line

  useEffect(() => {
    if (!farmId) { setDetections([]); return; }
    const tid = setTimeout(() => {
      api.get(`/detections/farm/${farmId}`, {
        headers:{ Authorization:`Bearer ${token}` }, timeout:8000,
      })
        .then(r => setDetections(r.data || []))
        .catch(() => setDetections([]));
    }, 300);
    return () => clearTimeout(tid);
  }, [farmId]); // eslint-disable-line

  const handleLogout = () => { localStorage.removeItem("token"); window.location.reload(); };
  const handleLang   = (l) => { setLanguage(l); setShowLang(false); };

  const totalRipe     = detections.reduce((s,d) => s + (d.ripe   || 0), 0);
  const totalUnripe   = detections.reduce((s,d) => s + (d.unripe || 0), 0);
  const healthyCount  = detections.filter(d => d.is_healthy === "True"  || d.is_healthy === true).length;
  const diseasedCount = detections.filter(d => d.is_healthy === "False" || d.is_healthy === false).length;

  const stripStats = isDiseaseFarm
    ? [
        { label:"Scans",    value:detections.length, color:"#6366F1" },
        { label:"Healthy",  value:healthyCount,      color:"#10B981" },
        { label:"Diseased", value:diseasedCount,     color:"#EF4444" },
      ]
    : [
        { label:"Scans",    value:detections.length, color:"#6366F1" },
        { label:"Ripe",     value:totalRipe,         color:"#10B981" },
        { label:"Unripe",   value:totalUnripe,       color:"#F59E0B" },
      ];

  return (
    <>
      {/* ── TOP BAR ── */}
      <StickyTopBar>
        <SearchContainer style={{ flex:1, maxWidth:"320px" }}>
          <SearchIcon />
          <SearchBar
            placeholder={t("dashboard.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchContainer>

        <FarmSelectorWrapper>
          <span>🌾</span>
          <FarmSelect
            value={selectedFarm?.id || ""}
            onChange={e => {
              const f = farms.find(f => f.id === Number(e.target.value));
              if (f) setSelectedFarm(f);
            }}
          >
            <option value="" disabled>Select farm…</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} {f.farm_type === "plant_disease_only" ? "🌿" : "🍈"}
              </option>
            ))}
          </FarmSelect>
        </FarmSelectorWrapper>

        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ position:"relative", zIndex:10 }}>
            <LangBtn onClick={() => setShowLang(!showLang)}>
              <FaGlobe/>{language === "en" ? "EN" : "中文"}
            </LangBtn>
            {showLang && (
              <LangDropdown>
                <LangOption onClick={() => handleLang("en")} className={language==="en"?"active":""}>English</LangOption>
                <LangOption onClick={() => handleLang("zh")} className={language==="zh"?"active":""}>中文</LangOption>
              </LangDropdown>
            )}
          </div>
          <div style={{ position:"relative" }}>
            <Avatar onClick={() => setShowUserMenu(!showUserMenu)}>F</Avatar>
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

      {(showLang || showUserMenu) && (
        <div style={{position:"fixed",inset:0,zIndex:99}}
          onClick={() => { setShowLang(false); setShowUserMenu(false); }}/>
      )}

      <Main ismap={activeTab === "map"}>

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <>
            {!selectedFarm ? (
              <Section>
                <NoFarm>
                  <p style={{color:"#6B7280",fontSize:"1rem",margin:0}}>
                    🌾 Select a farm from the dropdown above to view analytics.
                  </p>
                </NoFarm>
              </Section>
            ) : (
              <Section>

                {/* 1 — Welcome strip */}
                <WelcomeStrip>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                      <span style={{fontWeight:600,fontSize:"1.1rem",color:"#1F2937"}}>
                        👋 {selectedFarm.name}
                      </span>
                      <FarmTypeBadge isDisease={isDiseaseFarm}>
                        {isDiseaseFarm ? "🌿 Plant Disease" : "🍈 Lychee Farm"}
                      </FarmTypeBadge>
                    </div>
                    <div style={{fontSize:"0.82rem",color:"#9CA3AF",marginTop:"0.2rem"}}>
                      {detections.length > 0
                        ? `${detections.length} scan${detections.length !== 1 ? "s" : ""} recorded`
                        : "No scans yet"}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                    {stripStats.map(({label,value,color}) => (
                      <StatPill key={label} color={color}>
                        <span style={{fontSize:"1.2rem",fontWeight:700,color}}>{value}</span>
                        <span style={{fontSize:"0.68rem",color:"#9CA3AF"}}>{label}</span>
                      </StatPill>
                    ))}
                  </div>
                </WelcomeStrip>

                {/* 2 — Sensor widget */}
                <SensorWidget farmId={farmId} />

                {/* 3 — Harvest prediction (lychee only) */}
                {!isDiseaseFarm && (
                  predictionLoading ? (
                    <Skeleton>
                      <Shimmer style={{height:"24px",width:"40%",margin:"0 auto 1rem"}}/>
                      <Shimmer style={{height:"14px",width:"60%",margin:"0 auto 0.5rem"}}/>
                    </Skeleton>
                  ) : (
                    <>
                      <PredictionEngine harvestPrediction={harvestPrediction} detections={detections}/>
                      {harvestPrediction && <HarvestTimeline prediction={harvestPrediction}/>}
                    </>
                  )
                )}

                {/* 4 — Map + Summary */}
                <Grid>
                  <MapWrap>
                    <Title>🗺️ {selectedFarm.name}</Title>
                    <DashboardFarmMap
                      selectedFarm={selectedFarm}
                      farms={filteredFarms}
                      setSelectedFarm={setSelectedFarm}
                      loading={loading}
                      detections={detections}
                      farmType={farmType}
                    />
                  </MapWrap>
                  <SumWrap>
                    <Title>{isDiseaseFarm ? "🌿 Plant Health" : "📊 Farm Summary"}</Title>
                    <FarmSummary
                      selectedFarm={selectedFarm}
                      detections={detections}
                      currentModel={farmType}
                    />
                  </SumWrap>
                </Grid>

                {/* 5 — Detection history (lychee only) */}
                {!isDiseaseFarm && detections.length > 0 && (
                  <Card2>
                    <Title>📈 Detection History</Title>
                    <WeeklyProgress selectedFarm={selectedFarm} detections={detections}/>
                  </Card2>
                )}

                {/* 6 — Weather (always) */}
                {summaryData.length > 0 && (
                  <Card2>
                    <Title>{t("dashboard.fiveDayForecast")}</Title>
                    <WeatherForecast summaryData={summaryData} selectedFarmId={selectedFarm.id}/>
                  </Card2>
                )}

              </Section>
            )}
          </>
        )}

        {/* ── SUMMARY ── */}
        {activeTab === "summary" && (
          <div style={{width:"100%",padding:"0.5rem 0"}}>
            <SummaryPage token={token}/>
          </div>
        )}

        {/* ── MAP ── */}
        {activeTab === "map" && (
          <FullMap>
            <HarvestRoutePlanner
              selectedFarm={selectedFarm}
              detections={detections}
              farms={farms}
              setSelectedFarm={setSelectedFarm}
            />
          </FullMap>
        )}

      </Main>
    </>
  );
}
