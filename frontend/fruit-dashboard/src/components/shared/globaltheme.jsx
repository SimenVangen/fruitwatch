import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F0F4F8;
    color: #1F2937;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Subtle scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #F1F5F9; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

  /* Smooth transitions globally */
  a, button { transition: all 0.2s ease; }

  /* Remove default button outline */
  button:focus { outline: none; }
  button:focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }
`;

export const theme = {
  colors: {
    // Greens — slightly richer
    primaryDark: "#065F46",
    primary: "#10B981",
    primaryLight: "#D1FAE5",

    // Accent
    accent: "#F59E0B",
    accentLight: "#FEF3C7",

    // Backgrounds — slightly cooler grey, less harsh than pure white
    background: "#F0F4F8",
    cardBackground: "#FFFFFF",
    surfaceHover: "#F8FAFC",

    // Text
    textDark: "#111827",
    textMedium: "#374151",
    textLight: "#6B7280",
    textMuted: "#9CA3AF",

    // Borders & shadows
    border: "#E2E8F0",
    borderLight: "#F1F5F9",
    shadow: "rgba(0, 0, 0, 0.06)",
    shadowMedium: "rgba(0, 0, 0, 0.12)",

    // Status colors
    success: "#10B981",
    successLight: "#D1FAE5",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    info: "#3B82F6",
    infoLight: "#DBEAFE",
  },

  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    md: "0 4px 16px rgba(0,0,0,0.08)",
    lg: "0 8px 30px rgba(0,0,0,0.12)",
    xl: "0 20px 60px rgba(0,0,0,0.16)",
  },

  borderRadius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    full: "9999px",
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "2rem",
    },
  },
};
