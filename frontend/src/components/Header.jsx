import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';
import './Header.css';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo and Brand */}
        <div className="header__brand">
          <div className="header__logo">
            <span className="header__logo-icon">🔥</span>
            <span className="header__logo-text">RAGnarok</span>
          </div>
          <span className="header__tagline">AI Document Chat</span>
        </div>

        {/* Actions */}
        <div className="header__actions">
          <Button
            variant="ghost"
            size="small"
            onClick={toggleTheme}
            icon={theme === 'light' ? '🌙' : '☀️'}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
