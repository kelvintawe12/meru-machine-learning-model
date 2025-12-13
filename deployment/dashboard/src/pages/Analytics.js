import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Analytics as AnalyticsIcon,
  Refresh,
  BarChart,
  PieChart as PieChartIcon,
  Timeline,
  ShowChart,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { useAPI } from '../hooks/useAPI';
import toast from 'react-hot-toast';

const Analytics = ({ getAnalytics }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('loss');
  const [error, setError] = useState(null);

  const { getHealthStatus, getPredictions } = useAPI();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalytics(timeRange);
      setAnalyticsData(data);
      toast.success('Analytics data loaded successfully');
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const healthStatus = await getHealthStatus();
      console.log('System health:', healthStatus);
      await loadAnalytics();
    } catch (err) {
      console.error('Failed to refresh data:', err);
      toast.error('Failed to refresh analytics data');
    }
  };

  const getMetricData = () => {
    if (!analyticsData) return [];
    
    switch (selectedMetric) {
      case 'loss':
        return analyticsData.lossTrends || [];
      case 'efficiency':
        return analyticsData.efficiencyTrend || [];
      case 'yield':
        return analyticsData.lossTrends.map(item => ({
          time: item.time,
          yield: 100 - item.loss,
        }));
      default:
        return analyticsData.lossTrends || [];
    }
  };

  const getMetricColor = (metric) => {
    switch (metric) {
      case 'loss':
        return '#F44336';
      case 'efficiency':
        return '#4CAF50';
      case 'yield':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getTrendDirection = (data) => {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3);
    const values = recent.map(d => selectedMetric === 'loss' ? d.loss : 
                    selectedMetric === 'efficiency' ? d.efficiency : d.yield);
    
    const first = values[0];
    const last = values[values.length - 1];
    
    if (selectedMetric === 'loss') {
      if (last < first) return 'improving';
      if (last > first) return 'worsening';
    } else {
      if (last > first) return 'improving';
      if (last < first) return 'worsening';
    }
    
    return 'stable';
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp />;
      case 'worsening':
        return <TrendingDown />;
      default:
        return <Timeline />;
    }
  };

  const getQualityScoreColor = (score) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'primary';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const getQualityIcon = (score) => {
    if (score >= 95) return <CheckCircle />;
    if (score >= 85) return <ShowChart />;
    if (score >= 75) return <Warning />;
    return <Error />;
  };

  if (!analyticsData && !loading) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Analytics Data Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Load analytics data to view refinery performance metrics
            </Typography>
            <Button variant="contained" startIcon={<Refresh />} onClick={loadAnalytics}>
              Load Analytics
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

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
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Comprehensive refinery performance analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="6h">6 Hours</MenuItem>
                <MenuItem value="24h">24 Hours</MenuItem>
                <MenuItem value="7d">7 Days</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Loading analytics data...
          </Typography>
        </Box>
      )}

      {/* Key Performance Indicators */}
      {analyticsData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            {
              title: 'Total Predictions',
              value: analyticsData.totalPredictions,
              icon: <Assessment />,
              color: 'primary',
              trend: 'stable',
            },
            {
              title: 'Average Loss',
              value: `${analyticsData.averageLoss}%`,
              icon: <TrendingUp />,
              color: analyticsData.averageLoss > 3 ? 'error' : 'success',
              trend: analyticsData.averageLoss > 3 ? 'up' : 'down',
            },
            {
              title: 'Yield Efficiency',
              value: `${analyticsData.yieldAnalysis.efficiency.toFixed(1)}%`,
              icon: <ShowChart />,
              color: analyticsData.yieldAnalysis.efficiency > 95 ? 'success' : 'warning',
              trend: analyticsData.yieldAnalysis.efficiency > 95 ? 'up' : 'down',
            },
            {
              title: 'Overall Quality',
              value: `${analyticsData.qualityMetrics.overall.toFixed(1)}%`,
              icon: getQualityIcon(analyticsData.qualityMetrics.overall),
              color: getQualityScoreColor(analyticsData.qualityMetrics.overall),
              trend: analyticsData.qualityMetrics.overall > 90 ? 'up' : 'down',
            },
          ].map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.title}>
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
                          {kpi.title}
                        </Typography>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'white' }}>
                          {kpi.value}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {kpi.trend === 'up' ? (
                            <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: 'white' }} />
                          ) : kpi.trend === 'down' ? (
                            <TrendingDown sx={{ fontSize: 16, mr: 0.5, color: 'white' }} />
                          ) : (
                            <Timeline sx={{ fontSize: 16, mr: 0.5, color: 'white' }} />
                          )}
                          <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                            {kpi.trend === 'up' ? 'Improving' : 
                             kpi.trend === 'down' ? 'Declining' : 'Stable'}
                          </Typography>
                        </Box>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        {kpi.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Charts Section */}
      {analyticsData && (
        <Grid container spacing={3}>
          {/* Main Trend Chart */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="chart-container">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Performance Trends ({timeRange})
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Metric</InputLabel>
                    <Select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      label="Metric"
                    >
                      <MenuItem value="loss">Loss Percentage</MenuItem>
                      <MenuItem value="efficiency">Efficiency</MenuItem>
                      <MenuItem value="yield">Yield Percentage</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                  <Chip
                    icon={getTrendIcon(getTrendDirection(getMetricData()))}
                    label={`Trend: ${getTrendDirection(getMetricData())}`}
                    color={getTrendDirection(getMetricData()) === 'improving' ? 'success' : 
                           getTrendDirection(getMetricData()) === 'worsening' ? 'error' : 'default'}
                    size="small"
                  />
                </Box>

                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={getMetricData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedMetric === 'loss' && (
                      <Area
                        type="monotone"
                        dataKey="loss"
                        fill="#F44336"
                        fillOpacity={0.3}
                        stroke="#F44336"
                        strokeWidth={2}
                        name="Loss %"
                      />
                    )}
                    {selectedMetric === 'efficiency' && (
                      <Area
                        type="monotone"
                        dataKey="efficiency"
                        fill="#4CAF50"
                        fillOpacity={0.3}
                        stroke="#4CAF50"
                        strokeWidth={2}
                        name="Efficiency %"
                      />
                    )}
                    {selectedMetric === 'yield' && (
                      <Area
                        type="monotone"
                        dataKey="yield"
                        fill="#2196F3"
                        fillOpacity={0.3}
                        stroke="#2196F3"
                        strokeWidth={2}
                        name="Yield %"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </Grid>

          {/* Quality Metrics */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="chart-container">
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Quality Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    { label: 'Overall Quality', value: analyticsData.qualityMetrics.overall, target: 95 },
                    { label: 'Process Quality', value: analyticsData.qualityMetrics.process, target: 90 },
                    { label: 'Product Quality', value: analyticsData.qualityMetrics.product, target: 98 },
                  ].map((metric) => (
                    <Box key={metric.label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{metric.label}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {metric.value.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(metric.value, 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={getQualityScoreColor(metric.value)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Target: {metric.target}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </motion.div>
          </Grid>

          {/* Yield Analysis */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="chart-container">
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Yield Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight={700}>
                        {analyticsData.yieldAnalysis.current.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Yield
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight={700}>
                        {analyticsData.yieldAnalysis.target.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Target Yield
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Yield Efficiency</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {analyticsData.yieldAnalysis.efficiency.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(analyticsData.yieldAnalysis.efficiency, 100)}
                    sx={{ height: 10, borderRadius: 5 }}
                    color="primary"
                  />
                </Box>
              </Card>
            </motion.div>
          </Grid>

          {/* Performance Summary */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="chart-container">
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Performance Summary
                </Typography>
                <List>
                  {[
                    {
                      title: 'Predictions Analyzed',
                      value: analyticsData.totalPredictions,
                      icon: <Assessment />,
                      color: 'primary',
                    },
                    {
                      title: 'Average Processing Time',
                      value: '2.3s',
                      icon: <Timeline />,
                      color: 'success',
                    },
                    {
                      title: 'System Uptime',
                      value: '99.8%',
                      icon: <CheckCircle />,
                      color: 'success',
                    },
                    {
                      title: 'Data Quality Score',
                      value: `${analyticsData.qualityMetrics.overall.toFixed(1)}%`,
                      icon: getQualityIcon(analyticsData.qualityMetrics.overall),
                      color: getQualityScoreColor(analyticsData.qualityMetrics.overall),
                    },
                  ].map((item, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${item.color}.main`, width: 32, height: 32 }}>
                          {item.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.title}
                        secondary={item.value}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'body1', fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
