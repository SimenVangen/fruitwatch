// src/components/dashboard/FloatingPanel.jsx
import React, { useState } from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  position: absolute;
  ${props => props.position === 'top-right' && 'top: 20px; right: 20px;'}
  ${props => props.position === 'top-left' && 'top: 20px; left: 20px;'}
  ${props => props.position === 'bottom-center' && 'bottom: 20px; left: 50%; transform: translateX(-50%);'}
  
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  border: 1px solid #E5E7EB;
  padding: 1rem;
  max-width: 320px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  
  /* Smooth animations */
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #F3F4F6;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6B7280;
  padding: 0.25rem;
  
  &:hover {
    color: #374151;
  }
`;

export default function FloatingPanel({ 
  title, 
  children, 
  position = 'top-right',
  onClose,
  showClose = true 
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <PanelContainer position={position}>
      <PanelHeader>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1F2937' }}>
          {title}
        </h4>
        {showClose && (
          <CloseButton onClick={handleClose}>×</CloseButton>
        )}
      </PanelHeader>
      <div style={{ fontSize: '0.9rem' }}>
        {children}
      </div>
    </PanelContainer>
  );
}