
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { CheckCircle, Error, Warning, Speed } from '@mui/icons-material';

const LoadingScreen = ({ loadingState = {} }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const loadingSteps = [
    {
      id: 'api',
      title: 'Connecting to API',
      description: 'Establishing connection to refinery API',
      icon: <Speed />,
    },
    {
      id: 'models',
      title: 'Loading AI Models',
      description: 'Initializing machine learning models',
      icon: <Speed />,
    },
    {
      id: 'websocket',
      title: 'Setting up Real-time',
      description: 'Configuring WebSocket connections',
      icon: <Speed />,
    },
    {
      id: 'dashboard',
      title: 'Preparing Dashboard',
      description: 'Loading dashboard components',
      icon: <Speed />,
    },
  ];

  const getStepStatus = (stepId) => {
    const stepIndex = loadingSteps.findIndex(step => step.id === stepId);
    if (loadingState[stepId] === 'completed') return 'completed';
    if (loadingState[stepId] === 'error') return 'error';
    if (loadingState[stepId] === 'loading' || stepIndex <= currentStep) return 'loading';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />;
      case 'error':
        return <Error sx={{ color: '#f44336', fontSize: 16 }} />;
      case 'loading':
        return <CircularProgress size={16} sx={{ color: 'white' }} />;
      default:
        return <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'loading':
        return '#FFC107';
      default:
        return 'rgba(255,255,255,0.3)';
    }
  };

  useEffect(() => {
    // Animate progress based on current step
    const progress = ((currentStep + 1) / loadingSteps.length) * 100;
    setAnimatedProgress(progress);
  }, [currentStep, loadingSteps.length]);

  useEffect(() => {
    // Auto-advance steps for demo (remove in production)
    if (!loadingState.manual) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [loadingState.manual, loadingSteps.length]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)',
          backgroundSize: '50px 50px',
          animation: 'slide 20s linear infinite',
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', zIndex: 1 }}
      >
        {/* Mount Meru Logo */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: '3rem',
              marginBottom: '8px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Mount Meru
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 400,
              fontSize: '1.5rem',
              marginBottom: '32px',
              opacity: 0.9,
            }}
          >
            SoyCo Refinery Dashboard
          </Typography>
        </motion.div>

        {/* Progress Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}
        >
          <CircularProgress
            variant="determinate"
            value={animatedProgress}
            size={80}
            thickness={4}
            sx={{
              color: 'rgba(255,255,255,0.3)',
              position: 'relative',
            }}
          />
          <CircularProgress
            variant="indeterminate"
            size={80}
            thickness={4}
            sx={{
              color: 'white',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {Math.round(animatedProgress)}%
            </Typography>
          </Box>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ marginBottom: '32px' }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              marginBottom: '8px',
            }}
          >
            {loadingSteps[currentStep]?.title || 'Initializing...'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.8,
              maxWidth: '400px',
            }}
          >
            {loadingSteps[currentStep]?.description || 'Please wait while we set up your refinery monitoring system...'}
          </Typography>
        </motion.div>

        {/* Loading Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{ marginBottom: '32px', width: '100%', maxWidth: '500px' }}
        >
          <Box sx={{ textAlign: 'left' }}>
            {loadingSteps.map((step, index) => {
              const status = getStepStatus(step.id);
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: status === 'loading' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(status)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{ 
                        fontWeight: status === 'loading' ? 600 : 400,
                        color: status === 'completed' ? '#4CAF50' : 
                               status === 'error' ? '#f44336' : 'white',
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ 
                        opacity: 0.7,
                        fontSize: '0.875rem',
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                  {status === 'completed' && (
                    <Chip
                      label="Ready"
                      size="small"
                      sx={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  {status === 'error' && (
                    <Chip
                      label="Error"
                      size="small"
                      sx={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </Box>
        </motion.div>

        {/* Model Status (if available) */}
        {loadingState.models && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            style={{ marginBottom: '24px', width: '100%', maxWidth: '400px' }}
          >
            <Box sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '16px',
              textAlign: 'left',
            }}>
              <Typography variant="subtitle2" sx={{ mb: 2, opacity: 0.9 }}>
                Model Loading Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(loadingState.models).map(([model, status]) => (
                  <Box key={model} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {status === 'loaded' ? (
                        <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />
                      ) : status === 'error' ? (
                        <Error sx={{ color: '#f44336', fontSize: 16 }} />
                      ) : (
                        <CircularProgress size={12} sx={{ color: 'white' }} />
                      )}
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {status}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        )}

        {/* Overall Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          style={{ marginBottom: '32px', width: '100%', maxWidth: '400px' }}
        >
          <LinearProgress
            variant="determinate"
            value={animatedProgress}
            sx={{
              height: '6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
                borderRadius: '3px',
              },
            }}
          />
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        >
          <Typography
            variant="caption"
            sx={{ opacity: 0.6, fontSize: '0.8rem' }}
          >
            Mount Meru SoyCo v3.0.0 | Refinery AI Dashboard
          </Typography>
        </motion.div>
      </motion.div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </Box>
  );
};

export default LoadingScreen;

