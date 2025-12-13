import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  PlayArrow,
  Stop,
  Speed,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAPI } from '../hooks/useAPI';

const RealTimeMonitoring = ({ socket, isConnected }) => {
  const [realTimeData, setRealTimeData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState({
    totalLoss: 2.3,
    efficiency: 94.7,
    yield: 97.2,
    quality: 96.1,
  });

  const { subscribeToRefineryData, subscribeToAlerts, sendMessage } = useWebSocket(
    'ws://localhost:8000/ws'
  );
  const { getHealthStatus } = useAPI();

  // Handle WebSocket messages
  useEffect(() => {
    if (socket && isConnected) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'refinery_data') {
            // Update real-time metrics
            setMetrics(prev => ({
              totalLoss: data.metrics.loss || prev.totalLoss,
              efficiency: data.metrics.efficiency || prev.efficiency,
              yield: data.metrics.yield || prev.yield,
              quality: data.metrics.quality || prev.quality,
            }));
            
            // Add to real-time data history
            setRealTimeData(prev => {
              const newData = [...prev, {
                timestamp: new Date().toLocaleTimeString(),
                loss: data.metrics.loss,
                efficiency: data.metrics.efficiency,
                yield: data.metrics.yield,
                quality: data.metrics.quality,
              }].slice(-50); // Keep last 50 data points
              
              return newData;
            });
          } else if (data.type === 'alert') {
            setAlerts(prev => [data.alert, ...prev].slice(0, 10)); // Keep last 10 alerts
          }
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket, isConnected]);

  // Start/stop monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      sendMessage({ type: 'unsubscribe', channel: 'refinery_data' });
      sendMessage({ type: 'unsubscribe', channel: 'alerts' });
    } else {
      subscribeToRefineryData();
      subscribeToAlerts();
    }
    setIsMonitoring(!isMonitoring);
  };

  // Refresh data manually
  const refreshData = async () => {
    try {
      const healthStatus = await getHealthStatus();
      console.log('System status:', healthStatus);
      
      // Simulate getting current metrics
      setMetrics(prev => ({
        totalLoss: +(prev.totalLoss + (Math.random() - 0.5) * 0.1).toFixed(2),
        efficiency: +(prev.efficiency + (Math.random() - 0.5) * 0.5).toFixed(2),
        yield: +(prev.yield + (Math.random() - 0.5) * 0.3).toFixed(2),
        quality: +(prev.quality + (Math.random() - 0.5) * 0.4).toFixed(2),
      }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <CheckCircle />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 700 }}>
              Real-Time Monitoring
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Live refinery operations and alerts
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<Speed />}
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              variant="outlined"
            />
            <Button
              variant={isMonitoring ? 'outlined' : 'contained'}
              color={isMonitoring ? 'warning' : 'success'}
              startIcon={isMonitoring ? <Stop /> : <PlayArrow />}
              onClick={toggleMonitoring}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshData}
              disabled={!isConnected}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            title: 'Total Loss',
            value: `${metrics.totalLoss}%`,
            icon: <TrendingUp />,
            color: 'error',
            trend: metrics.totalLoss > 2.5 ? 'up' : 'down',
          },
          {
            title: 'Efficiency',
            value: `${metrics.efficiency}%`,
            icon: <Speed />,
            color: 'success',
            trend: metrics.efficiency > 95 ? 'up' : 'down',
          },
          {
            title: 'Yield',
            value: `${metrics.yield}%`,
            icon: <TrendingUp />,
            color: 'primary',
            trend: 'up',
          },
          {
            title: 'Quality Score',
            value: `${metrics.quality}%`,
            icon: <CheckCircle />,
            color: 'secondary',
            trend: 'up',
          },
        ].map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="metric-card" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {metric.title}
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'white' }}>
                        {metric.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {metric.trend === 'up' ? (
                          <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: 'white' }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 16, mr: 0.5, color: 'white' }} />
                        )}
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                          {isMonitoring ? 'Live' : 'Paused'}
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                      {metric.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Real-time Charts */}
      <Grid container spacing={3}>
        {/* Live Metrics Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Live Metrics ({isMonitoring ? 'Active' : 'Paused'})
              </Typography>
              {realTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={realTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                    <Line
                      type="monotone"
                      dataKey="yield"
                      stroke="#2196F3"
                      strokeWidth={2}
                      name="Yield %"
                    />
                    <Line
                      type="monotone"
                      dataKey="quality"
                      stroke="#FF9800"
                      strokeWidth={2}
                      name="Quality %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">
                    {isMonitoring ? 'Waiting for data...' : 'Start monitoring to see live data'}
                  </Typography>
                </Box>
              )}
            </Card>
          </motion.div>
        </Grid>

        {/* Real-time Alerts */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Live Alerts
              </Typography>
              {alerts.length > 0 ? (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {alerts.map((alert, index) => (
                    <Alert
                      key={index}
                      severity={getAlertColor(alert.severity)}
                      sx={{ mb: 1 }}
                      icon={getAlertIcon(alert.severity)}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {alert.message}
                      </Typography>
                      <Typography variant="caption">
                        {alert.timestamp}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">
                    {isMonitoring ? 'No alerts' : 'Start monitoring for alerts'}
                  </Typography>
                </Box>
              )}
            </Card>
          </motion.div>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                System Status
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Component</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Performance</TableCell>
                      <TableCell>Last Update</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { name: 'Data Acquisition', status: 'optimal', performance: 98.5 },
                      { name: 'Model Processing', status: 'good', performance: 95.2 },
                      { name: 'Alert System', status: 'optimal', performance: 99.1 },
                      { name: 'Communication', status: isConnected ? 'optimal' : 'warning', performance: isConnected ? 97.8 : 45.2 },
                    ].map((component) => (
                      <TableRow key={component.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: component.status === 'optimal' ? 'success.main' : 
                                        component.status === 'good' ? 'primary.main' : 'warning.main',
                                width: 24,
                                height: 24,
                                mr: 1,
                              }}
                            >
                              {component.status === 'optimal' ? <CheckCircle /> : 
                               component.status === 'good' ? <Speed /> : <Warning />}
                            </Avatar>
                            {component.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={component.status}
                            color={component.status === 'optimal' ? 'success' : 
                                   component.status === 'good' ? 'primary' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={component.performance}
                              sx={{ width: 100, mr: 1 }}
                              color={component.performance > 95 ? 'success' : 
                                     component.performance > 80 ? 'primary' : 'warning'}
                            />
                            <Typography variant="body2">
                              {component.performance}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date().toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeMonitoring;
