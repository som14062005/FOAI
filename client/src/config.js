// src/config.js
const LOCAL_IP = '192.168.1.35';
const BACKEND_PORT = '3000';

export const API_CONFIG = {
  // Detect if running on mobile/network
  getBaseURL: () => {
    const hostname = window.location.hostname;
    
    // If accessing via IP (from mobile), use IP for API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${LOCAL_IP}:${BACKEND_PORT}`;
    }
    
    // If on localhost (computer), use localhost
    return 'http://localhost:3000';
  }
};

export const APP_CONFIG = {
  LOCAL_IP: LOCAL_IP,
  FRONTEND_PORT: '5173',
  BACKEND_PORT: BACKEND_PORT
};
