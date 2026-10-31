import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useToast } from './ToastContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [latestLiveAlert, setLatestLiveAlert] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const wsRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    let reconnectTimeout = null;
    const wsUrl =
      import.meta.env.VITE_WS_BASE_URL ||
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/alerts`;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ALERT_DISPATCHED' || data.alert_type) {
              setLatestLiveAlert(data);
              setLiveAlerts((prev) => [data, ...prev.slice(0, 19)]);
              addToast({
                title: `🚨 ${data.severity || 'HIGH'} ALERT`,
                message: data.message || 'New infrastructure anomaly detected.',
                type: data.severity === 'CRITICAL' ? 'error' : 'warning',
                duration: 6000,
              });
            }
          } catch {
            // Heartbeat response or text
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnect every 10 seconds
          reconnectTimeout = setTimeout(connect, 10000);
        };
      } catch {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [addToast]);

  return (
    <WebSocketContext.Provider value={{ isConnected, latestLiveAlert, liveAlerts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketAlerts = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketAlerts must be used within a WebSocketProvider');
  }
  return context;
};
