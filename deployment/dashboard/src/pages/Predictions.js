import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Add,
  PlayArrow,
  Refresh,
  Visibility,
  Download,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
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
} from 'recharts';
import { motion } from 'framer-motion';
import { useAPI } from '../hooks/useAPI';
import toast from 'react-hot-toast';

const Predictions = ({ getPredictions }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [newPrediction, setNewPrediction] = useState({
    percentage_yield: 90,
    gravity: 0.8,
    vapour_pressure: 3.0,
    ten_percent_distillation: 250,
    fraction_end_point: 375,
    actual_feed_mt: 500,
    feed_ffa: 2.5,
    moisture: 0.2,
    bleaching_earth_quantity: 25,
    phosphoric_acid_quantity: 1.5,
    citric_acid_quantity: 0.8,
    phenamol_quantity: 0.5,
    fractionation_feed: 90,
    phenomol_consumption: 0.25,
  });

  const {
    makePrediction,
    makeBatchPrediction,
    loading: apiLoading,
    error: apiError,
  } = useAPI();

  // Load predictions on component mount
  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const data = await getPredictions(20);
      setPredictions(data);
    } catch (error) {
      console.error('Failed to load predictions:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPrediction = async () => {
    try {
      const prediction = await makePrediction({
        ...newPrediction,
        process_type: 'refinery',
        convert_to_percentage: true,
      });
      
      // Add new prediction to the list
      const newPred = {
        id: predictions.length + 1,
        timestamp: new Date().toISOString(),
        prediction: prediction.loss_percentage.toFixed(2),
        confidence: prediction.confidence_level,
        yield_percentage: prediction.yield_percentage.toFixed(2),
        parameters: {
          feed_quality: (100 - newPrediction.feed_ffa).toFixed(1),
          processing_temp: newPrediction.ten_percent_distillation.toFixed(0),
          pressure: newPrediction.vapour_pressure.toFixed(1),
          actual_feed_mt: newPrediction.actual_feed_mt.toFixed(0),
          moisture: newPrediction.moisture.toFixed(2),
          feed_ffa: newPrediction.feed_ffa.toFixed(2),
        },
        status: prediction.loss_percentage < 2 ? 'optimal' : 
               prediction.loss_percentage < 3 ? 'good' : 'warning',
        detailed_analysis: {
          loss_breakdown: prediction.loss_breakdown,
          yield_analysis: prediction.yield_analysis,
          process_metrics: prediction.process_metrics,
        },
      };
      
      setPredictions(prev => [newPred, ...prev]);
      toast.success('New prediction completed successfully');
      
    } catch (error) {
      console.error('Failed to make prediction:', error);
      toast.error('Failed to make prediction');
    }
  };

  const handleBatchPrediction = async () => {
    try {
      // Generate batch data
      const batchData = Array.from({ length: 5 }, (_, i) => ({
        ...newPrediction,
        percentage_yield: newPrediction.percentage_yield + (Math.random() - 0.5) * 10,
        actual_feed_mt: newPrediction.actual_feed_mt + (Math.random() - 0.5) * 100,
        feed_ffa: newPrediction.feed_ffa + (Math.random() - 0.5) * 2,
      }));
      
      const batchRequest = {
        requests: batchData.map(data => ({
          ...data,
          process_type: 'refinery',
          convert_to_percentage: true,
        })),
        analysis_type: 'detailed',
      };
      
      const batchResult = await makeBatchPrediction(batchRequest);
      toast.success(`Batch prediction completed: ${batchResult.total_predictions} predictions`);
      
      // Add batch results to predictions list
      const newPredictions = batchResult.predictions.map((pred, index) => ({
        id: predictions.length + index + 1,
        timestamp: new Date(Date.now() - index * 60000).toISOString(),
        prediction: pred.loss_percentage.toFixed(2),
        confidence: pred.confidence_level,
        yield_percentage: pred.yield_percentage.toFixed(2),
        parameters: {
          feed_quality: (100 - batchData[index].feed_ffa).toFixed(1),
          processing_temp: batchData[index].ten_percent_distillation.toFixed(0),
          pressure: batchData[index].vapour_pressure.toFixed(1),
          actual_feed_mt: batchData[index].actual_feed_mt.toFixed(0),
          moisture: batchData[index].moisture.toFixed(2),
          feed_ffa: batchData[index].feed_ffa.toFixed(2),
        },
        status: pred.loss_percentage < 2 ? 'optimal' : 
               pred.loss_percentage < 3 ? 'good' : 'warning',
        detailed_analysis: {
          loss_breakdown: pred.loss_breakdown,
          yield_analysis: pred.yield_analysis,
          process_metrics: pred.process_metrics,
        },
      }));
      
      setPredictions(prev => [...newPredictions, ...prev]);
      
    } catch (error) {
      console.error('Failed to make batch prediction:', error);
      toast.error('Failed to make batch prediction');
    }
  };

  const handleViewDetails = (prediction) => {
    setSelectedPrediction(prediction);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal':
        return 'success';
      case 'good':
        return 'primary';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLossDistributionData = (prediction) => {
    if (!prediction.detailed_analysis?.loss_breakdown) return [];
    
    const breakdown = prediction.detailed_analysis.loss_breakdown;
    return [
      { name: 'Raw Material', value: breakdown.raw_material_loss, color: '#FF6384' },
      { name: 'Energy', value: breakdown.energy_loss, color: '#36A2EB' },
      { name: 'Process', value: breakdown.process_loss, color: '#FFCE56' },
      { name: 'Waste', value: breakdown.waste_loss, color: '#4BC0C0' },
      { name: 'Efficiency', value: breakdown.efficiency_loss, color: '#9966FF' },
    ];
  };

  const formatParameterName = (param) => {
    return param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
              AI Predictions
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Machine learning-powered refinery loss predictions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadPredictions}
              disabled={loading || apiLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNewPrediction}
              disabled={apiLoading}
            >
              New Prediction
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Error Alert */}
      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {apiError.message || 'An error occurred while making predictions'}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Recent Predictions" />
          <Tab label="New Prediction" />
          <Tab label="Batch Analysis" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Predictions Table */}
          <Card className="chart-container">
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Recent Predictions
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <LinearProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Loss %</TableCell>
                      <TableCell>Yield %</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Feed MT</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictions.map((prediction) => (
                      <TableRow key={prediction.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            #{prediction.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(prediction.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={parseFloat(prediction.prediction) > 3 ? 'error.main' : 'success.main'}
                          >
                            {prediction.prediction}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {prediction.yield_percentage}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prediction.confidence}
                            color={getConfidenceColor(prediction.confidence)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prediction.status}
                            color={getStatusColor(prediction.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {prediction.parameters?.actual_feed_mt || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDetails(prediction)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </motion.div>
      )}

      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card className="chart-container">
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  New Prediction Parameters
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(newPrediction).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <TextField
                        fullWidth
                        label={formatParameterName(key)}
                        type="number"
                        value={value}
                        onChange={(e) => setNewPrediction(prev => ({
                          ...prev,
                          [key]: parseFloat(e.target.value) || 0
                        }))}
                        size="small"
                        inputProps={{
                          step: key.includes('_') || key === 'percentage_yield' ? 0.1 : 1,
                          min: 0,
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleNewPrediction}
                    disabled={apiLoading}
                    size="large"
                  >
                    Run Prediction
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setNewPrediction({
                      percentage_yield: 90,
                      gravity: 0.8,
                      vapour_pressure: 3.0,
                      ten_percent_distillation: 250,
                      fraction_end_point: 375,
                      actual_feed_mt: 500,
                      feed_ffa: 2.5,
                      moisture: 0.2,
                      bleaching_earth_quantity: 25,
                      phosphoric_acid_quantity: 1.5,
                      citric_acid_quantity: 0.8,
                      phenamol_quantity: 0.5,
                      fractionation_feed: 90,
                      phenomol_consumption: 0.25,
                    })}
                  >
                    Reset
                  </Button>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className="chart-container">
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => setActiveTab(0)}
                    fullWidth
                  >
                    View History
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleBatchPrediction}
                    disabled={apiLoading}
                    fullWidth
                  >
                    Batch Analysis
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="chart-container">
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Batch Prediction Analysis
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Run multiple predictions with varying parameters to analyze trends and optimize operations.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleBatchPrediction}
              disabled={apiLoading}
              size="large"
            >
              Run Batch Analysis (5 predictions)
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Prediction Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Prediction Details #{selectedPrediction?.id}
        </DialogTitle>
        <DialogContent>
          {selectedPrediction && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Overview
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loss Percentage
                  </Typography>
                  <Typography variant="h5" color="error">
                    {selectedPrediction.prediction}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Yield Percentage
                  </Typography>
                  <Typography variant="h5" color="success">
                    {selectedPrediction.yield_percentage}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Confidence Level
                  </Typography>
                  <Chip
                    label={selectedPrediction.confidence}
                    color={getConfidenceColor(selectedPrediction.confidence)}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedPrediction.status}
                    color={getStatusColor(selectedPrediction.status)}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Loss Distribution
                </Typography>
                {selectedPrediction.detailed_analysis && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={getLossDistributionData(selectedPrediction)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {getLossDistributionData(selectedPrediction).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Process Parameters
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(selectedPrediction.parameters || {}).map(([key, value]) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <Typography variant="body2" color="text.secondary">
                        {formatParameterName(key)}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {value}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Predictions;
