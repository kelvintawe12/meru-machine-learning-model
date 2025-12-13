import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import RealTimeMonitoring from './pages/RealTimeMonitoring';
import Predictions from './pages/Predictions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LoadingScreen from './components/LoadingScreen';
import { useWebSocket } from './hooks/useWebSocket';
import { useAPI } from './hooks/useAPI';
import './App.css';


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingState, setLoadingState] = useState({
    api: 'loading',
    models: 'loading',
    websocket: 'loading',
    dashboard: 'loading',
    modelsData: {},
    manual: false
  });
  const [refineryData, setRefineryData] = useState(null);
  const location = useLocation();
  
  // Initialize WebSocket connection for real-time data
  const { socket, isConnected } = useWebSocket('ws://localhost:8000/ws');
  
  // Initialize API hooks
  const { getHealthStatus, getModelsStatus, getPredictions, getAnalytics } = useAPI();



  useEffect(() => {
    // Initialize app with detailed loading states
    const initializeApp = async () => {
      try {
        // Step 1: Check API health
        setLoadingState(prev => ({ ...prev, api: 'loading' }));
        const healthStatus = await getHealthStatus();
        setLoadingState(prev => ({ ...prev, api: 'completed' }));
        console.log('API Health Status:', healthStatus);
        
        // Step 2: Check models status
        setLoadingState(prev => ({ ...prev, models: 'loading' }));
        const modelsStatus = await getModelsStatus();
        const modelsData = modelsStatus.models || {};
        setLoadingState(prev => ({ 
          ...prev, 
          models: 'completed',
          modelsData: modelsData 
        }));
        console.log('Models Status:', modelsStatus);
        
        // Step 3: Wait for WebSocket connection
        setLoadingState(prev => ({ ...prev, websocket: 'loading' }));
        // Wait a bit for WebSocket to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingState(prev => ({ ...prev, websocket: 'completed' }));
        
        // Step 4: Prepare dashboard
        setLoadingState(prev => ({ ...prev, dashboard: 'loading' }));
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoadingState(prev => ({ ...prev, dashboard: 'completed' }));
        
        // All steps completed
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Mark failed steps
        setLoadingState(prev => ({
          ...prev,
          api: error.message?.includes('API') ? 'error' : prev.api,
          models: error.message?.includes('model') ? 'error' : prev.models,
          websocket: error.message?.includes('WebSocket') ? 'error' : prev.websocket,
          dashboard: 'error'
        }));
        // Still set loading to false to show error state in components
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Handle WebSocket messages
    if (socket && isConnected) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setRefineryData(data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  }, [socket, isConnected]);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };


  // Loading screen
  if (loading) {
    return <LoadingScreen loadingState={loadingState} />;
  }

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Navigation Bar */}
      <Navbar 
        onMenuClick={handleDrawerToggle}
        sidebarOpen={sidebarOpen}
        isConnected={isConnected}
      />
      
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen}
        onToggle={handleDrawerToggle}
        location={location}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? 240 : 60}px)` },
          ml: { sm: sidebarOpen ? '240px' : '60px' },
          transition: 'margin-left 0.3s ease',
          backgroundColor: '#F5F5F5',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        
        {/* Page Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    refineryData={refineryData}
                    isConnected={isConnected}
                  />
                } 
              />
              <Route 
                path="/monitoring" 
                element={
                  <RealTimeMonitoring 
                    socket={socket}
                    isConnected={isConnected}
                  />
                } 
              />
              <Route 
                path="/predictions" 
                element={
                  <Predictions 
                    getPredictions={getPredictions}
                  />
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <Analytics 
                    getAnalytics={getAnalytics}
                  />
                } 
              />
              <Route 
                path="/settings" 
                element={<Settings />} 
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default App;

