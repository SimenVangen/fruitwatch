// src/components/shared/LanguageToggle.jsx
import React from 'react';
import { IconButton, Typography, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Tooltip title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}>
      <IconButton 
        onClick={toggleLanguage}
        color="inherit"
        size="small"
      >
        <LanguageIcon />
        <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
          {language === 'en' ? 'EN' : '中文'}
        </Typography>
      </IconButton>
    </Tooltip>
  );
};

export default LanguageToggle;