import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationContainer } from './components/ui/Notification';
import Header from './components/Header';
import MainContent from './components/MainContent';
import './styles/variables.css';
import './App.css';

function App() {
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
        <Header />
        
        <main className="app__main">
          <MainContent onNotification={addNotification} />
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