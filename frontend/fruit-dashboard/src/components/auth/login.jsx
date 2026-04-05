import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaGlobe } from "react-icons/fa";
import api from "../../api/axios";
import styled, { keyframes, createGlobalStyle } from "styled-components";

const Fonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const scanline = keyframes`
  0% { top: -2px; }
  100% { top: 100%; }
`;

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0c0e0d;
  font-family: 'Inter', sans-serif;
`;

// LEFT
const LeftPanel = styled.div`
  flex: 1.1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 3rem;
  @media (max-width: 900px) { display: none; }
`;

const BgImage = styled.div`
  position: absolute; inset: 0;
  background: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&fit=crop') center/cover no-repeat;
  filter: brightness(0.5) saturate(0.75);
  transition: transform 10s ease;
  &:hover { transform: scale(1.04); }
`;

const Overlay = styled.div`
  position: absolute; inset: 0;
  background:
    linear-gradient(to top, rgba(4,15,9,0.97) 0%, rgba(4,15,9,0.35) 55%, transparent 100%),
    linear-gradient(to right, rgba(4,15,9,0.5) 0%, transparent 70%);
`;

const ScanWrap = styled.div`
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.04;
`;

const ScanBar = styled.div`
  position: absolute; left: 0; right: 0; height: 2px;
  background: #10b981;
  animation: ${scanline} 9s linear infinite;
`;

const TopBadge = styled.div`
  position: absolute; top: 2.5rem; left: 3rem; z-index: 2;
`;

const Logo = styled.div`
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.25);
  border-radius: 8px;
  padding: 0.45rem 1rem;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: #10b981;
  backdrop-filter: blur(8px);
`;

const LeftContent = styled.div`
  position: relative; z-index: 2;
  animation: ${fadeUp} 0.9s ease both;
  animation-delay: 0.2s;
`;

const Eyebrow = styled.p`
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #10b981;
  margin: 0 0 0.75rem;
  font-weight: 500;
`;

const LeftTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 1.05;
  margin: 0 0 2rem;
  color: white;
  letter-spacing: -0.03em;
`;

const Stats = styled.div`
  display: flex;
  gap: 2.5rem;
`;

const StatItem = styled.div`
  animation: ${fadeUp} 0.6s ease both;
  animation-delay: ${p => p.d};
`;

const StatNum = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
`;

const StatLbl = styled.div`
  font-size: 0.73rem;
  color: rgba(255,255,255,0.35);
  margin-top: 0.2rem;
  letter-spacing: 0.02em;
`;

const Dots = styled.div`
  display: flex; gap: 0.4rem; margin-top: 2.5rem;
`;

const Dot = styled.div`
  height: 5px;
  width: ${p => p.a ? '22px' : '5px'};
  border-radius: 3px;
  background: ${p => p.a ? '#10b981' : 'rgba(255,255,255,0.18)'};
  transition: all 0.3s;
`;

// RIGHT
const RightPanel = styled.div`
  width: 450px;
  background: #101410;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 3.5rem;
  position: relative;
  border-left: 1px solid rgba(255,255,255,0.05);
  @media (max-width: 900px) { width: 100%; padding: 2rem 1.5rem; }
`;

const TopRight = styled.div`
  position: absolute; top: 1.75rem; right: 1.75rem;
`;

const LangBtn = styled.button`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 7px;
  padding: 0.38rem 0.7rem;
  color: rgba(255,255,255,0.4);
  font-size: 0.77rem;
  cursor: pointer;
  display: flex; align-items: center; gap: 0.35rem;
  transition: all 0.2s;
  &:hover { border-color: rgba(16,185,129,0.5); color: #10b981; }
`;

const LangMenu = styled.div`
  position: absolute; top: calc(1.75rem + 32px); right: 1.75rem;
  background: #181f1a;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  overflow: hidden;
  z-index: 200;
  min-width: 120px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
`;

const LangOpt = styled.button`
  width: 100%; padding: 0.65rem 1rem;
  background: ${p => p.a ? 'rgba(16,185,129,0.12)' : 'none'};
  color: ${p => p.a ? '#10b981' : 'rgba(255,255,255,0.5)'};
  border: none; text-align: left; cursor: pointer;
  font-size: 0.85rem; transition: all 0.15s;
  &:hover { background: rgba(255,255,255,0.04); color: white; }
`;

const FormWrap = styled.div`
  animation: ${fadeUp} 0.7s ease both;
  animation-delay: 0.15s;
`;

const FormHead = styled.div`margin-bottom: 2.25rem;`;

const Title = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.4rem;
  letter-spacing: -0.025em;
`;

const Sub = styled.p`
  font-size: 0.875rem;
  color: rgba(255,255,255,0.3);
  margin: 0;
`;

const Lbl = styled.label`
  display: block;
  font-size: 0.72rem;
  font-weight: 500;
  color: rgba(255,255,255,0.35);
  margin-bottom: 0.4rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const IWrap = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.82rem 1rem;
  padding-right: ${p => p.pr ? '2.75rem' : '1rem'};
  background: rgba(255,255,255,0.04);
  border: 1px solid ${p => p.f ? 'rgba(16,185,129,0.55)' : 'rgba(255,255,255,0.07)'};
  border-radius: 9px;
  color: white;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
  box-shadow: ${p => p.f ? '0 0 0 3px rgba(16,185,129,0.07)' : 'none'};
  &::placeholder { color: rgba(255,255,255,0.15); }
  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 30px #101410 inset;
    -webkit-text-fill-color: white;
  }
`;

const Eye = styled.button`
  position: absolute; right: 0.85rem; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.2); padding: 0;
  &:hover { color: rgba(255,255,255,0.5); }
`;

const Btn = styled.button`
  width: 100%;
  padding: 0.88rem;
  background: #10b981;
  color: #052e1c;
  border: none;
  border-radius: 9px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: all 0.2s;
  margin-top: 0.5rem;

  &:hover {
    background: #0ea572;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(16,185,129,0.22);
  }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const Err = styled.div`
  background: rgba(239,68,68,0.07);
  border: 1px solid rgba(239,68,68,0.18);
  color: #f87171;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  font-size: 0.84rem;
  margin-top: 0.75rem;
  animation: ${fadeIn} 0.3s ease;
`;

const Sep = styled.div`
  display: flex; align-items: center; gap: 0.9rem;
  margin: 1.4rem 0;
  color: rgba(255,255,255,0.12);
  font-size: 0.76rem;
  &::before, &::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.06);
  }
`;

const RegisterP = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.25);
  margin: 0;
  span {
    color: #10b981; cursor: pointer; font-weight: 500;
    &:hover { text-decoration: underline; }
  }
`;

const T = {
  en: { title: "Sign in", sub: "Access your farm intelligence dashboard", u: "Username", p: "Password", btn: "Continue →", loading: "Signing in...", no: "New here?", reg: "Create an account", err: "Invalid username or password." },
  zh: { title: "登录", sub: "访问您的农场智能仪表板", u: "用户名", p: "密码", btn: "继续 →", loading: "登录中...", no: "还没有账户？", reg: "立即注册", err: "用户名或密码无效。" },
};

export default function Login({ setToken, setShowRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");
  const [showLang, setShowLang] = useState(false);
  const [focus, setFocus] = useState(null);

  const t = k => T[lang]?.[k] || k;

  useEffect(() => {
    const s = localStorage.getItem("app-language");
    if (s) setLang(s);
  }, []);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      setToken(res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
    } catch { setError(t("err")); }
    finally { setLoading(false); }
  };

  const handleLang = l => { setLang(l); setShowLang(false); localStorage.setItem("app-language", l); };

  return (
    <>
      <Fonts />
      <Wrapper>
        {/* LEFT */}
        <LeftPanel>
          <BgImage />
          <Overlay />
          <ScanWrap><ScanBar /></ScanWrap>
          <TopBadge><Logo>🌾 FRUITWATCH</Logo></TopBadge>
          <LeftContent>
            <Eyebrow>AI-Powered Agriculture</Eyebrow>
            <LeftTitle>Harvest<br />smarter,<br />not harder.</LeftTitle>
            <Stats>
              <StatItem d="0.3s"><StatNum>98%</StatNum><StatLbl>Detection accuracy</StatLbl></StatItem>
              <StatItem d="0.4s"><StatNum>2×</StatNum><StatLbl>Faster harvests</StatLbl></StatItem>
              <StatItem d="0.5s"><StatNum>360°</StatNum><StatLbl>Fruit coverage</StatLbl></StatItem>
            </Stats>
            <Dots><Dot a /><Dot /><Dot /></Dots>
          </LeftContent>
        </LeftPanel>

        {/* RIGHT */}
        <RightPanel>
          <TopRight>
            <LangBtn onClick={() => setShowLang(!showLang)}>
              <FaGlobe size={11} />{lang === "en" ? "EN" : "中文"}
            </LangBtn>
          </TopRight>

          {showLang && (
            <>
              <LangMenu>
                <LangOpt a={lang === "en"} onClick={() => handleLang("en")}>English</LangOpt>
                <LangOpt a={lang === "zh"} onClick={() => handleLang("zh")}>中文</LangOpt>
              </LangMenu>
              <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowLang(false)} />
            </>
          )}

          <FormWrap>
            <FormHead>
              <Title>{t("title")}</Title>
              <Sub>{t("sub")}</Sub>
            </FormHead>

            <form onSubmit={handleLogin}>
              <IWrap>
                <Lbl>{t("u")}</Lbl>
                <Input type="text" placeholder="your_username" value={username}
                  f={focus === "u"} onFocus={() => setFocus("u")} onBlur={() => setFocus(null)}
                  onChange={e => { setUsername(e.target.value); setError(""); }} required />
              </IWrap>

              <IWrap>
                <Lbl>{t("p")}</Lbl>
                <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={password}
                  pr f={focus === "p"} onFocus={() => setFocus("p")} onBlur={() => setFocus(null)}
                  onChange={e => { setPassword(e.target.value); setError(""); }} required />
                <Eye type="button" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </Eye>
              </IWrap>

              <Btn type="submit" disabled={loading}>
                {loading ? t("loading") : t("btn")}
              </Btn>
            </form>

            {error && <Err>⚠️ {error}</Err>}
            <Sep>or</Sep>
            <RegisterP>{t("no")} <span onClick={() => setShowRegister(true)}>{t("reg")}</span></RegisterP>
          </FormWrap>
        </RightPanel>
      </Wrapper>
    </>
  );
}
