import styled, { keyframes } from "styled-components";
import { FaSearch } from "react-icons/fa";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Layout ───────────────────────────────────────────────────
export const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  overflow: hidden;
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${props => props.theme?.colors?.background || "#F0F4F8"};
  animation: ${fadeIn} 0.5s ease;
`;

export const Content = styled.div`padding: 2rem; display: flex; gap: 1.5rem;`;
export const LeftContent = styled.div`flex: 1.5; display: flex; flex-direction: column; gap: 1.5rem;`;
export const RightPanel = styled.div`flex: 0.8; display: flex; flex-direction: column; gap: 1.5rem;`;

// ─── Cards ────────────────────────────────────────────────────
export const Card = styled.div`
  background: ${props => props.theme?.colors?.cardBackground || "#fff"};
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: ${props => props.theme?.shadows?.md || "0 4px 16px rgba(0,0,0,0.08)"};
  border: 1px solid ${props => props.theme?.colors?.borderLight || "#F1F5F9"};
  transition: box-shadow 0.2s ease;
`;

export const CardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.textLight || "#6B7280"};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const CardValue = styled.p`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.textDark || "#111827"};
  line-height: 1.2;
`;

// ─── Sidebar ──────────────────────────────────────────────────
export const Sidebar = styled.div`
  width: 240px;
  background: linear-gradient(180deg, #065F46 0%, #064E3B 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 1rem;
  box-shadow: 2px 0 12px rgba(0,0,0,0.1);
`;

export const SidebarTop = styled.div``;

export const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2.5rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
`;

export const NavItem = styled.div`
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 10px;
  color: ${props => props.active ? "white" : "rgba(255,255,255,0.75)"};
  background: ${props => props.active ? "rgba(255,255,255,0.15)" : "transparent"};
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255,255,255,0.12);
    transform: translateX(3px);
  }
`;

export const Logout = styled.button`
  background: ${props => props.theme?.colors?.accent || "#F59E0B"};
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245,158,11,0.4);
  }
`;

export const MainPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme?.colors?.background || "#F0F4F8"};
  min-width: 0;
`;

export const TopBar = styled.div`
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border-bottom: 1px solid #F1F5F9;
`;

// ─── Search ───────────────────────────────────────────────────
export const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const SearchBar = styled.input`
  width: 300px;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid ${props => props.theme?.colors?.border || "#E2E8F0"};
  border-radius: 10px;
  font-size: 0.9rem;
  background: #F8FAFC;
  color: ${props => props.theme?.colors?.textDark || "#111827"};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10B981;
    background: white;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
  }

  &::placeholder { color: #9CA3AF; }
`;

export const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 0.75rem;
  color: ${props => props.theme?.colors?.textLight || "#9CA3AF"};
  font-size: 0.85rem;
`;

export const UserBox = styled.div`text-align: right; font-size: 0.95rem;`;

// ─── Welcome Banner ───────────────────────────────────────────
export const WelcomeBanner = styled.div`
  margin: 0;
  background: linear-gradient(135deg, #065F46 0%, #10B981 60%, #059669 100%);
  color: white;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  box-shadow: 0 8px 32px rgba(6,95,70,0.25);
  position: relative;
  overflow: hidden;

  /* Subtle pattern overlay */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%;
    pointer-events: none;
  }
`;

export const BannerTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

export const BannerSubtitle = styled.p`
  font-size: 1rem;
  margin-top: 0.4rem;
  opacity: 0.85;
  font-weight: 400;
`;

export const StatsRow = styled.div`
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

// ─── Auth / Forms ─────────────────────────────────────────────
export const FormCard = styled.div`
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  width: 380px;
  border: 1px solid #F1F5F9;
`;

export const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.75rem;
  color: ${props => props.theme?.colors?.primaryDark || "#065F46"};
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const InputGroup = styled.div`position: relative; margin-bottom: 1.25rem;`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: ${props => props.hasIcon ? "2.5rem" : "1rem"};
  border: 1.5px solid ${props => props.theme?.colors?.border || "#E2E8F0"};
  border-radius: 10px;
  font-size: 0.95rem;
  color: #111827;
  background: #FAFAFA;
  transition: all 0.2s ease;

  &:focus {
    border-color: #10B981;
    background: white;
    outline: none;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
  }

  &::placeholder { color: #9CA3AF; }
`;

export const IconButton = styled.span`
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6B7280;
  &:hover { color: #374151; }
`;

export const Button = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  border: none;
  padding: 0.85rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  letter-spacing: 0.01em;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(16,185,129,0.4);
  }

  &:active { transform: translateY(0); }

  &:disabled {
    background: #A7F3D0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const Message = styled.p`
  text-align: center;
  color: ${props => props.error ? "#EF4444" : "#10B981"};
  margin-top: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
`;

export const SwitchText = styled.p`
  text-align: center;
  margin-top: 1.25rem;
  color: #6B7280;
  font-size: 0.9rem;

  span {
    color: ${props => props.theme?.colors?.primary || "#10B981"};
    cursor: pointer;
    font-weight: 600;
    &:hover { text-decoration: underline; }
  }
`;

// ─── Map & Fields ─────────────────────────────────────────────
export const MapContainer = styled.div`
  position: relative;
  height: 300px;
  border-radius: 12px;
  background: #e8f5e9;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
`;

export const FieldZone = styled.div`
  position: absolute;
  border: 2px solid ${props => props.color};
  background: ${props => props.color}20;
  color: ${props => props.color};
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { background: ${props => props.color}40; transform: scale(1.05); }
`;
