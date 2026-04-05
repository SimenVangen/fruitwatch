import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import droneAnimation from "../../assets/drone.json";
import styled, { keyframes, createGlobalStyle } from "styled-components";

const Fonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500&display=swap');
`;

const fadeOut = keyframes`from { opacity: 1; } to { opacity: 0; }`;
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const barFill = keyframes`from { width: 0%; } to { width: 100%; }`;
const blink = keyframes`0%, 100% { opacity: 1; } 50% { opacity: 0; }`;
const slideUp = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;

const Splash = styled.div`
  position: fixed; inset: 0;
  background: #080f0a;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 9999;
  animation: ${props => props.exiting ? fadeOut : fadeIn} 0.6s ease forwards;
  font-family: 'Inter', sans-serif;
`;

const Grid = styled.div`
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px);
  background-size: 48px 48px;
`;

const Vignette = styled.div`
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(4,10,6,0.9) 100%);
  pointer-events: none;
`;

const Corner = styled.div`
  position: absolute; width: 20px; height: 20px;
  border-color: rgba(16,185,129,0.25); border-style: solid; border-width: 0;
  ${p => p.tl && `top:2rem;left:2rem;border-top-width:1px;border-left-width:1px;`}
  ${p => p.tr && `top:2rem;right:2rem;border-top-width:1px;border-right-width:1px;`}
  ${p => p.bl && `bottom:2rem;left:2rem;border-bottom-width:1px;border-left-width:1px;`}
  ${p => p.br && `bottom:2rem;right:2rem;border-bottom-width:1px;border-right-width:1px;`}
`;

const LottieWrap = styled.div`
  width: 220px; height: 220px;
  position: relative; z-index: 2;
`;

const Content = styled.div`
  text-align: center; position: relative; z-index: 2;
  animation: ${slideUp} 0.7s ease both; animation-delay: 0.3s;
`;

const Brand = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 2rem; font-weight: 800;
  color: white; letter-spacing: -0.03em;
  margin-bottom: 0.25rem;
  span { color: #10b981; }
`;

const Tagline = styled.div`
  font-size: 0.75rem; color: rgba(255,255,255,0.25);
  letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 2rem;
`;

const Track = styled.div`
  width: 200px; height: 2px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px; overflow: hidden; margin: 0 auto 0.9rem;
`;

const Fill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #065f46, #10b981);
  animation: ${barFill} ${p => p.duration}ms cubic-bezier(0.4,0,0.2,1) forwards;
`;

const Status = styled.div`
  font-size: 0.73rem; color: rgba(16,185,129,0.65);
  letter-spacing: 0.06em; font-family: 'Syne', sans-serif;
  min-height: 1.2em; animation: ${slideUp} 0.3s ease;
`;

const Cursor = styled.span`
  display: inline-block; width: 1px; height: 0.85em;
  background: #10b981; margin-left: 2px; vertical-align: middle;
  animation: ${blink} 0.8s step-end infinite;
`;

const STEPS = [
  "Initializing sensors...",
  "Connecting to farm network...",
  "Loading detection models...",
  "Calibrating GPS...",
  "Ready for flight.",
];
const DURATION = 3000;

export default function LoadingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const interval = DURATION / STEPS.length;
    const timers = STEPS.map((_, i) => setTimeout(() => setStep(i), i * interval));
    const exit = setTimeout(() => {
      setExiting(true);
      setTimeout(onComplete, 600);
    }, DURATION);
    return () => { timers.forEach(clearTimeout); clearTimeout(exit); };
  }, []); // eslint-disable-line

  return (
    <>
      <Fonts />
      <Splash exiting={exiting}>
        <Grid /><Vignette />
        <Corner tl /><Corner tr /><Corner bl /><Corner br />

        <LottieWrap>
          <Lottie animationData={droneAnimation} loop autoplay />
        </LottieWrap>

        <Content>
          <Brand>Fruit<span>Watch</span></Brand>
          <Tagline>Farm Intelligence Platform</Tagline>
          <Track><Fill duration={DURATION} /></Track>
          <Status key={step}>{STEPS[step]}<Cursor /></Status>
        </Content>
      </Splash>
    </>
  );
}