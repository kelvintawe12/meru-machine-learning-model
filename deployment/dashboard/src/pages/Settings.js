import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save,
  Refresh,
  Security,
  Notifications,
  DataUsage,
  Webhook,
  Storage,
  Speed,
  Warning,
  CheckCircle,
  Edit,
  Delete,
  Add,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAPI } from '../hooks/useAPI';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // General Settings
    refreshInterval: 5000,
    autoRefresh: true,
    theme: 'light',
    language: 'en',
    
    // API Settings
    apiTimeout: 10000,
    retryAttempts: 3,
    batchSize: 50,
    enableCaching: true,
    
    // Notification Settings
    enableNotifications: true,
    emailAlerts: true,
    soundAlerts: false,
    alertThreshold: 3.0,
    
    // Data Settings
    dataRetentionDays: 30,
    exportFormat: 'csv',
    compressionEnabled: true,
    
    // WebSocket Settings
    wsReconnectAttempts: 5,
    wsHeartbeatInterval: 30000,
    enableRealTimeData: true,
    
    // Performance Settings
    maxConcurrentRequests: 10,
    enableCompression: true,
    cacheSize: '100MB',
  });

  const [alertRules, setAlertRules] = useState([
    {
      id: 1,
      name: 'High Loss Alert',
      metric: 'loss_percentage',
      threshold: 3.0,
      severity: 'warning',
      enabled: true,
      description: 'Trigger when loss exceeds 3%',
    },
    {
      id: 2,
      name: 'Low Efficiency Alert',
      metric: 'efficiency',
      threshold: 90.0,
      severity: 'critical',
      enabled: true,
      description: 'Trigger when efficiency drops below 90%',
    },
    {
      id: 3,
      name: 'Quality Drop Alert',
      metric: 'quality_score',
      threshold: 85.0,
      severity: 'warning',
      enabled: false,
      description: 'Trigger when quality score falls below 85%',
    },
  ]);

  const [systemInfo, setSystemInfo] = useState({
    version: '3.0.0',
    uptime: '15 days, 8 hours',
    lastUpdate: '2024-01-15',
    modelsLoaded: true,
    apiStatus: 'operational',
    memoryUsage: '245 MB',
    diskUsage: '1.2 GB',
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
  });

  const { getHealthStatus, getModelsStatus } = useAPI();

  useEffect(() => {
    loadSystemInfo();
    loadSettings();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const [healthStatus, modelsStatus] = await Promise.all([
        getHealthStatus(),
        getModelsStatus(),
      ]);
      
      setSystemInfo(prev => ({
        ...prev,
        modelsLoaded: modelsStatus.models_loaded,
        apiStatus: healthStatus.status === 'ok' ? 'operational' : 'degraded',
      }));
    } catch (error) {
      console.error('Failed to load system info:', error);
      toast.error('Failed to load system information');
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('dashboardSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };


  const resetSettings = () => {
    setConfirmDialog({
      open: true,
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all settings to default values?',
      action: () => {
        setSettings({
          refreshInterval: 5000,
          autoRefresh: true,
          theme: 'light',
          language: 'en',
          apiTimeout: 10000,
          retryAttempts: 3,
          batchSize: 50,
          enableCaching: true,
          enableNotifications: true,
          emailAlerts: true,
          soundAlerts: false,
          alertThreshold: 3.0,
          dataRetentionDays: 30,
          exportFormat: 'csv',
          compressionEnabled: true,
          wsReconnectAttempts: 5,
          wsHeartbeatInterval: 30000,
          enableRealTimeData: true,
          maxConcurrentRequests: 10,
          enableCompression: true,
          cacheSize: '100MB',
        });
        toast.success('Settings reset to defaults');
      }
    });
  };

  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Settings exported successfully');
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast.error('Failed to export settings');
    }
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        setSettings(prev => ({ ...prev, ...importedSettings }));
        toast.success('Settings imported successfully');
      } catch (error) {
        console.error('Failed to import settings:', error);
        toast.error('Failed to import settings - invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const toggleAlertRule = (id) => {
    setAlertRules(prev =>
      prev.map(rule =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const addAlertRule = () => {
    const newRule = {
      id: Date.now(),
      name: 'New Alert Rule',
      metric: 'loss_percentage',
      threshold: 3.0,
      severity: 'warning',
      enabled: true,
      description: 'New alert rule',
    };
    setAlertRules(prev => [...prev, newRule]);
  };

  const deleteAlertRule = (id) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle />;
      case 'degraded':
        return <Warning />;
      case 'down':
        return <Warning />;
      default:
        return <SettingsIcon />;
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

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
              Settings
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Configure dashboard preferences and system settings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadSystemInfo}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={saveSettings}
            >
              Save Settings
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* System Status Alert */}
      {systemInfo.apiStatus !== 'operational' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          System status is {systemInfo.apiStatus}. Some features may not work correctly.
        </Alert>
      )}


      {/* Settings Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="General" icon={<SettingsIcon />} />
          <Tab label="API" icon={<Webhook />} />
          <Tab label="Notifications" icon={<Notifications />} />
          <Tab label="Data" icon={<Storage />} />
          <Tab label="Alerts" icon={<Warning />} />
          <Tab label="System" icon={<DataUsage />} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  General Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoRefresh}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                      />
                    }
                    label="Auto Refresh Data"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Refresh Interval</InputLabel>
                    <Select
                      value={settings.refreshInterval}
                      onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: e.target.value }))}
                      label="Refresh Interval"
                    >
                      <MenuItem value={1000}>1 second</MenuItem>
                      <MenuItem value={5000}>5 seconds</MenuItem>
                      <MenuItem value={10000}>10 seconds</MenuItem>
                      <MenuItem value={30000}>30 seconds</MenuItem>
                      <MenuItem value={60000}>1 minute</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={settings.theme}
                      onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                      label="Theme"
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Requests"
                    type="number"
                    value={settings.maxConcurrentRequests}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrentRequests: parseInt(e.target.value) }))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableCompression}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableCompression: e.target.checked }))}
                      />
                    }
                    label="Enable Compression"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Cache Size</InputLabel>
                    <Select
                      value={settings.cacheSize}
                      onChange={(e) => setSettings(prev => ({ ...prev, cacheSize: e.target.value }))}
                      label="Cache Size"
                    >
                      <MenuItem value="50MB">50 MB</MenuItem>
                      <MenuItem value="100MB">100 MB</MenuItem>
                      <MenuItem value="250MB">250 MB</MenuItem>
                      <MenuItem value="500MB">500 MB</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="API Timeout (ms)"
                    type="number"
                    value={settings.apiTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiTimeout: parseInt(e.target.value) }))}
                  />
                  <TextField
                    fullWidth
                    label="Retry Attempts"
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => setSettings(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                  />
                  <TextField
                    fullWidth
                    label="Batch Size"
                    type="number"
                    value={settings.batchSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableCaching}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableCaching: e.target.checked }))}
                      />
                    }
                    label="Enable API Caching"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  WebSocket Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Reconnect Attempts"
                    type="number"
                    value={settings.wsReconnectAttempts}
                    onChange={(e) => setSettings(prev => ({ ...prev, wsReconnectAttempts: parseInt(e.target.value) }))}
                  />
                  <TextField
                    fullWidth
                    label="Heartbeat Interval (ms)"
                    type="number"
                    value={settings.wsHeartbeatInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, wsHeartbeatInterval: parseInt(e.target.value) }))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableRealTimeData}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableRealTimeData: e.target.checked }))}
                      />
                    }
                    label="Enable Real-time Data"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                      />
                    }
                    label="Enable Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailAlerts}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                      />
                    }
                    label="Email Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.soundAlerts}
                        onChange={(e) => setSettings(prev => ({ ...prev, soundAlerts: e.target.checked }))}
                      />
                    }
                    label="Sound Alerts"
                  />
                  <TextField
                    fullWidth
                    label="Alert Threshold (%)"
                    type="number"
                    value={settings.alertThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, alertThreshold: parseFloat(e.target.value) }))}
                    inputProps={{ step: 0.1, min: 0, max: 100 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Management
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Data Retention (Days)"
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Export Format</InputLabel>
                    <Select
                      value={settings.exportFormat}
                      onChange={(e) => setSettings(prev => ({ ...prev, exportFormat: e.target.value }))}
                      label="Export Format"
                    >
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="xlsx">Excel</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.compressionEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                      />
                    }
                    label="Enable Compression"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="outlined" fullWidth onClick={exportSettings}>
                    Export Settings
                  </Button>
                  <Button variant="outlined" fullWidth component="label">
                    Import Settings
                    <input
                      type="file"
                      hidden
                      accept=".json"
                      onChange={importSettings}
                    />
                  </Button>
                  <Button variant="outlined" fullWidth onClick={resetSettings} color="warning">
                    Reset to Defaults
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Alert Rules
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={addAlertRule}
                  >
                    Add Rule
                  </Button>
                </Box>
                <List>
                  {alertRules.map((rule) => (
                    <ListItem key={rule.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: rule.enabled ? 'success.main' : 'grey.400' }}>
                          <Warning />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={rule.name}
                        secondary={`${rule.metric} ${rule.severity === 'critical' ? '>' : '<'} ${rule.threshold}`}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            checked={rule.enabled}
                            onChange={() => toggleAlertRule(rule.id)}
                          />
                          <Button
                            size="small"
                            onClick={() => deleteAlertRule(rule.id)}
                          >
                            <Delete />
                          </Button>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Version:</Typography>
                    <Typography variant="body2">{systemInfo.version}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Uptime:</Typography>
                    <Typography variant="body2">{systemInfo.uptime}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Last Update:</Typography>
                    <Typography variant="body2">{systemInfo.lastUpdate}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Memory Usage:</Typography>
                    <Typography variant="body2">{systemInfo.memoryUsage}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Disk Usage:</Typography>
                    <Typography variant="body2">{systemInfo.diskUsage}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">API Status:</Typography>
                    <Chip
                      icon={getStatusIcon(systemInfo.apiStatus)}
                      label={systemInfo.apiStatus}
                      color={getStatusColor(systemInfo.apiStatus)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Models Status:</Typography>
                    <Chip
                      icon={systemInfo.modelsLoaded ? <CheckCircle /> : <Warning />}
                      label={systemInfo.modelsLoaded ? 'Loaded' : 'Not Loaded'}
                      color={systemInfo.modelsLoaded ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmDialog.action?.();
              setConfirmDialog(prev => ({ ...prev, open: false }));
            }}
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
