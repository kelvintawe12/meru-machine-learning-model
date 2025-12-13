import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  LocalShipping,
  Factory,
  Speed,
  Assessment,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = ({ refineryData, isConnected }) => {
  const [metrics, setMetrics] = useState({
    totalLoss: 2.3,
    efficiency: 94.7,
    yield: 97.2,
    quality: 96.1,
    predictions: 156,
    alerts: 3,
  });

  const [historicalData] = useState([
    { time: '00:00', loss: 2.1, efficiency: 95.2, yield: 97.8, quality: 95.9 },
    { time: '04:00', loss: 2.3, efficiency: 94.8, yield: 97.1, quality: 96.2 },
    { time: '08:00', loss: 2.5, efficiency: 94.1, yield: 96.8, quality: 95.8 },
    { time: '12:00', loss: 2.2, efficiency: 95.0, yield: 97.4, quality: 96.5 },
    { time: '16:00', loss: 2.0, efficiency: 95.5, yield: 97.9, quality: 96.8 },
    { time: '20:00', loss: 2.3, efficiency: 94.7, yield: 97.2, quality: 96.1 },
  ]);

  const [lossBreakdown] = useState([
    { name: 'Raw Material', value: 0.7, color: '#FF6384' },
    { name: 'Energy', value: 0.5, color: '#36A2EB' },
    { name: 'Process', value: 0.6, color: '#FFCE56' },
    { name: 'Waste', value: 0.3, color: '#4BC0C0' },
    { name: 'Efficiency', value: 0.2, color: '#9966FF' },
  ]);

  const [refineryUnits] = useState([
    { id: 1, name: 'Crude Distillation', status: 'optimal', efficiency: 96.5 },
    { id: 2, name: 'Hydroprocessing', status: 'good', efficiency: 94.2 },
    { id: 3, name: 'Fractionation', status: 'optimal', efficiency: 97.1 },
    { id: 4, name: 'Blending', status: 'warning', efficiency: 89.8 },
  ]);

  const [recentAlerts] = useState([
    { id: 1, type: 'warning', message: 'Feed quality variation detected', time: '2 min ago' },
    { id: 2, type: 'info', message: 'Maintenance completed on Unit 2', time: '15 min ago' },
    { id: 3, type: 'success', message: 'Target yield achieved', time: '1 hour ago' },
  ]);


  useEffect(() => {
    // Load initial data and set up real-time updates if connected
    if (refineryData && isConnected) {
      setMetrics(prev => ({
        totalLoss: refineryData.totalLoss || prev.totalLoss,
        efficiency: refineryData.efficiency || prev.efficiency,
        yield: refineryData.yield || prev.yield,
        quality: refineryData.quality || prev.quality,
        predictions: refineryData.predictions || prev.predictions,
        alerts: refineryData.alerts || prev.alerts,
      }));
    }
  }, [refineryData, isConnected]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal':
      case 'success':
        return 'success';
      case 'good':
        return 'primary';
      case 'warning':
        return 'warning';
      case 'critical':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal':
      case 'success':
        return <CheckCircle />;
      case 'good':
        return <Speed />;
      case 'warning':
        return <Warning />;
      case 'critical':
      case 'error':
        return <Warning />;
      default:
        return <Assessment />;
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
              Mount Meru SoyCo Refinery Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Real-time monitoring and AI-powered optimization
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<Factory />}
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              variant="outlined"
            />
            <Chip
              icon={<Assessment />}
              label="AI Active"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </motion.div>

      {/* Key Metrics Cards */}
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
            icon: <Assessment />,
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
                          {metric.trend === 'up' ? 'Improving' : 'Needs attention'}
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

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Loss Trend Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Loss Percentage Trend (24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#F44336"
                    strokeWidth={3}
                    dot={{ fill: '#F44336', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        {/* Loss Breakdown Pie Chart */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Loss Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={lossBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {lossBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        {/* Efficiency Trend */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Process Efficiency
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#4CAF50"
                    fill="#4CAF50"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        {/* Refinery Units Status */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Refinery Units Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {refineryUnits.map((unit) => (
                  <Box
                    key={unit.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          bgcolor: `${getStatusColor(unit.status)}.main`,
                          mr: 2,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {getStatusIcon(unit.status)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {unit.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Unit {unit.id}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {unit.efficiency}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={unit.efficiency}
                        sx={{ mt: 0.5, width: 60 }}
                        color={getStatusColor(unit.status)}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Recent Alerts
              </Typography>
              <List>
                {recentAlerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getStatusColor(alert.type)}.main` }}>
                          {getStatusIcon(alert.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={alert.message}
                        secondary={alert.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < recentAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </motion.div>
        </Grid>

        {/* Yield Quality Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="chart-container">
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                Yield vs Quality Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke="#1976D2"
                    strokeWidth={2}
                    name="Yield %"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#4CAF50"
                    strokeWidth={2}
                    name="Quality %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

