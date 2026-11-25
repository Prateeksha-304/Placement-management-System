import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize Capacitor plugins when running as native app
const initCapacitor = async () => {
  try {
    if (window.Capacitor?.isNativePlatform()) {
      const { StatusBar } = await import('@capacitor/status-bar');
      const { SplashScreen } = await import('@capacitor/splash-screen');

      // Set status bar style
      await StatusBar.setBackgroundColor({ color: '#7f1d1d' });
      await StatusBar.setStyle({ style: 'LIGHT' });

      // Hide splash screen after app loads
      await SplashScreen.hide();
    }
  } catch (e) {
    // Capacitor plugins not available (running in browser)
    console.log('Running in browser mode');
  }
};

initCapacitor();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
