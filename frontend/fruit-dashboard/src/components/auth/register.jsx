// src/components/auth/register.jsx
import React, { useState } from "react";
import api from "../../api/axios";  // Correct path
import { 
  Container, 
  FormCard, 
  FormTitle, 
  InputGroup, 
  Input, 
  IconButton, 
  Button, 
  Message, 
  SwitchText 
} from "../shared/styledcomponents";
import { FaEye, FaEyeSlash, FaGlobe } from "react-icons/fa";
import styled from "styled-components";

// Language dropdown styles (same as login)
const LanguageSelector = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
`;

const LanguageButton = styled.button`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    border-color: #3b82f6;
  }
`;

const LanguageDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  overflow: hidden;
`;

const LanguageOption = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
  
  &.active {
    background: #3b82f6;
    color: white;
  }
`;

// Translations
const registerTranslations = {
  en: {
    title: "Register",
    username: "Username",
    email: "Email",
    password: "Password",
    registerButton: "Register",
    registering: "Registering...",
    haveAccount: "Already have an account?",
    login: "Login",
    success: "User created! You can now login.",
    error: "Registration failed",
    english: "English",
    chinese: "中文"
  },
  zh: {
    title: "注册",
    username: "用户名",
    email: "邮箱",
    password: "密码",
    registerButton: "注册",
    registering: "注册中...",
    haveAccount: "已有账户？",
    login: "登录",
    success: "用户创建成功！现在可以登录了。",
    error: "注册失败",
    english: "English",
    chinese: "中文"
  }
};

export default function Register({ setShowRegister }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const t = (key) => registerTranslations[language]?.[key] || key;

  // Get language from localStorage or default to English
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
  
    try {
      // ✅ FIXED: Use api.post() instead of axios.post()
      await api.post("/auth/register", { username, email, password });
      setSuccess(t('success'));
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
    localStorage.setItem('preferredLanguage', lang);
  };

  return (
    <Container>
      <LanguageSelector>
        <LanguageButton onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}>
          <FaGlobe />
          {language === 'en' ? 'EN' : '中文'}
        </LanguageButton>
        {showLanguageDropdown && (
          <LanguageDropdown>
            <LanguageOption 
              onClick={() => handleLanguageChange('en')}
              className={language === 'en' ? 'active' : ''}
            >
              {t('english')}
            </LanguageOption>
            <LanguageOption 
              onClick={() => handleLanguageChange('zh')}
              className={language === 'zh' ? 'active' : ''}
            >
              {t('chinese')}
            </LanguageOption>
          </LanguageDropdown>
        )}
      </LanguageSelector>

      <FormCard>
        <FormTitle>{t('title')}</FormTitle>
        <form onSubmit={handleRegister}>
          <InputGroup>
            <Input
              type="text"
              placeholder={t('username')}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              required
            />
          </InputGroup>

          <InputGroup>
            <Input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
            />
          </InputGroup>

          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t('password')}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              hasIcon
              required
            />
            <IconButton type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </IconButton>
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? t('registering') : t('registerButton')}
          </Button>
        </form>

        {error && <Message error>{error}</Message>}
        {success && <Message>{success}</Message>}

        <SwitchText>
          {t('haveAccount')} <span onClick={() => setShowRegister(false)}>{t('login')}</span>
        </SwitchText>
      </FormCard>

      {/* Close dropdown when clicking outside */}
      {showLanguageDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}
          onClick={() => setShowLanguageDropdown(false)}
        />
      )}
    </Container>
  );
}