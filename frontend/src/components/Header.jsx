import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';
import './Header.css';

const Header = ({ currentView, onViewChange, onNotification }) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'chat', label: 'RAG Chat', icon: '🔥' },
    { id: 'admin', label: 'Analytics', icon: '📊' }
  ];

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

        {/* Navigation */}
        <nav className="header__nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`header__nav-item ${currentView === item.id ? 'header__nav-item--active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <span className="header__nav-icon">{item.icon}</span>
              <span className="header__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

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
