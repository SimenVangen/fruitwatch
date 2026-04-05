import './App.css';
import React, { useState, useEffect } from "react";
import api from "./api/axios";
import { ThemeProvider } from "styled-components";
import { theme, GlobalStyle } from "./components/shared/globaltheme";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

import Login from "./components/auth/login";
import Register from "./components/auth/register";
import DashboardLayout from "./components/dashboard/dashboardlayout";
import LoadingScreen from "./components/shared/LoadingScreen";
import {
  AppContainer, Sidebar, Logo, NavItem, Logout, MainPanel,
} from "./components/shared/styledcomponents";

const translations = {
  en: { appName: "Fruit Dashboard", dashboard: "📊 Dashboard", map: "🗺️ Map", summary: "📈 Summary", logout: "🚪 Logout" },
  zh: { appName: "水果种植智能系统", dashboard: "📊 仪表板", map: "🗺️ 地图", summary: "📈 数据摘要", logout: "🚪 退出登录" },
};

function AppContent() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const { language } = useLanguage();
  const t = key => translations[language]?.[key] || key;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get("/farms", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setFarms(res.data);
        if (res.data.length > 0) setSelectedFarm(res.data[0]);
      })
      .catch(err => console.error("Error fetching farms:", err))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line

  if (showSplash) {
    return <LoadingScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!token) {
    return showRegister
      ? <Register setShowRegister={setShowRegister} />
      : <Login setToken={setToken} setShowRegister={setShowRegister} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Sidebar style={{ position: "fixed", left: 0, top: 0, height: "100vh", overflowY: "auto" }}>
          <Logo>{t("appName")}</Logo>
          <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>{t("dashboard")}</NavItem>
          <NavItem active={activeTab === "map"} onClick={() => setActiveTab("map")}>{t("map")}</NavItem>
          <NavItem active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>{t("summary")}</NavItem>
          <Logout onClick={() => { setToken(""); localStorage.removeItem("token"); }}>{t("logout")}</Logout>
        </Sidebar>
        <MainPanel style={{ marginLeft: "240px", width: "calc(100% - 240px)", height: "100vh", overflowY: "auto" }}>
          <DashboardLayout activeTab={activeTab} selectedFarm={selectedFarm} farms={farms} setSelectedFarm={setSelectedFarm} loading={loading} />
        </MainPanel>
      </AppContainer>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}