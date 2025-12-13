import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;
  const shouldReconnect = options.shouldReconnect !== false;
  
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Failed to parse message data');
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        if (shouldReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeoutId = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            setReconnectAttempts(reconnectAttemptsRef.current);
            connect();
          }, reconnectInterval);
          
          reconnectTimeoutRef.current = timeoutId;
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Maximum reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

      setSocket(ws);
      return ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      return null;
    }
  }, [url, maxReconnectAttempts, reconnectInterval, shouldReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const sendMessage = useCallback((message) => {
    if (socket && isConnected) {
      try {
        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        socket.send(messageString);
        return true;
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        setError('Failed to send message');
        return false;
      }
    } else {
      console.warn('WebSocket not connected');
      setError('WebSocket not connected');
      return false;
    }
  }, [socket, isConnected]);

  // Subscribe to real-time refinery data
  const subscribeToRefineryData = useCallback(() => {
    sendMessage({
      type: 'subscribe',
      channel: 'refinery_data',
      parameters: {
        metrics: ['loss', 'efficiency', 'yield', 'quality'],
        frequency: '5s'
      }
    });
  }, [sendMessage]);

  // Subscribe to alerts
  const subscribeToAlerts = useCallback(() => {
    sendMessage({
      type: 'subscribe',
      channel: 'alerts',
      parameters: {
        types: ['warning', 'critical', 'info'],
        threshold: 'medium'
      }
    });
  }, [sendMessage]);

  // Subscribe to predictions
  const subscribeToPredictions = useCallback(() => {
    sendMessage({
      type: 'subscribe',
      channel: 'predictions',
      parameters: {
        frequency: '30s',
        confidence_threshold: 0.8
      }
    });
  }, [sendMessage]);

  // Unsubscribe from channel
  const unsubscribe = useCallback((channel) => {
    sendMessage({
      type: 'unsubscribe',
      channel: channel
    });
  }, [sendMessage]);

  useEffect(() => {
    const ws = connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return {
    socket,
    isConnected,
    lastMessage,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    subscribeToRefineryData,
    subscribeToAlerts,
    subscribeToPredictions,
    unsubscribe
  };
};
