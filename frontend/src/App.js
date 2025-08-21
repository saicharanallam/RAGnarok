import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationContainer } from './components/ui/Notification';
import Header from './components/Header';
import MainContent from './components/MainContent';
import AdminPanel from './components/AdminPanel';
import './styles/variables.css';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'admin'
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <ThemeProvider>
      <div className="app">
        <Header 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNotification={addNotification}
        />
        
        <main className="app__main">
          {currentView === 'chat' && (
            <MainContent onNotification={addNotification} />
          )}
          {currentView === 'admin' && (
            <AdminPanel onNotification={addNotification} />
          )}
        </main>

        <NotificationContainer 
          notifications={notifications.map(n => ({
            ...n,
            onClose: () => removeNotification(n.id)
          }))}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;