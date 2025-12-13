import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline,
  Assessment,
  Analytics,
  Settings,
  TrendingUp,
  Warning,
  Speed,
  Factory,
  Notifications,
  ExpandLess,
  ExpandMore,
  BarChart,
  PieChart,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ open, onToggle, location }) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = React.useState(['monitoring']);

  const handleItemClick = (path) => {
    navigate(path);
  };

  const handleExpandClick = (item) => {
    setExpandedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      color: '#2E7D32',
    },
    {
      text: 'Real-time Monitoring',
      icon: <Timeline />,
      path: '/monitoring',
      color: '#1976D2',
      badge: '3',
    },
    {
      text: 'AI Predictions',
      icon: <Assessment />,
      path: '/predictions',
      color: '#FF9800',
    },
    {
      text: 'Analytics',
      icon: <Analytics />,
      path: '/analytics',
      color: '#9C27B0',
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      color: '#607D8B',
    },
  ];

  const monitoringSubItems = [
    { text: 'Live Metrics', icon: <Speed />, path: '/monitoring/metrics' },
    { text: 'Alerts & Notifications', icon: <Warning />, path: '/monitoring/alerts' },
    { text: 'Process Visualization', icon: <Factory />, path: '/monitoring/visualization' },
  ];

  const analyticsSubItems = [
    { text: 'Performance Trends', icon: <TrendingUp />, path: '/analytics/trends' },
    { text: 'Loss Analysis', icon: <BarChart />, path: '/analytics/loss' },
    { text: 'Efficiency Reports', icon: <PieChart />, path: '/analytics/efficiency' },
  ];

  const getItemColor = (path) => {
    const item = menuItems.find(item => item.path === path);
    return item ? item.color : '#2E7D32';
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? 240 : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 60,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #2E7D32 0%, #4CAF50 100%)',
          color: 'white',
          border: 'none',
          transition: 'width 0.3s ease',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', pt: 2 }}>
        {/* Sidebar Header */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ px: 2, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                  Mount Meru
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  SoyCo Dashboard
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />

        {/* Main Navigation */}
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleItemClick(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: getItemColor(item.path),
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ width: '100%' }}
                      >
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.9rem',
                            fontWeight: location.pathname === item.path ? 600 : 400,
                            color: 'white',
                          }}
                        />
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            color="error"
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ListItemButton>
              </ListItem>

              {/* Sub-items for Real-time Monitoring */}
              {item.text === 'Real-time Monitoring' && open && (
                <List component="div" disablePadding>
                  <Collapse in={expandedItems.includes('monitoring')} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {monitoringSubItems.map((subItem) => (
                        <ListItemButton
                          key={subItem.text}
                          sx={{
                            pl: 4,
                            minHeight: 40,
                            backgroundColor: location.pathname === subItem.path ? 'rgba(255,255,255,0.05)' : 'transparent',
                          }}
                          onClick={() => handleItemClick(subItem.path)}
                        >
                          <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center' }}>
                            {React.cloneElement(subItem.icon, { sx: { fontSize: 20, color: 'rgba(255,255,255,0.7)' } })}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.9)',
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                  <ListItemButton
                    onClick={() => handleExpandClick('monitoring')}
                    sx={{ minHeight: 40, justifyContent: open ? 'initial' : 'center' }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                      {expandedItems.includes('monitoring') ? <ExpandLess /> : <ExpandMore />}
                    </ListItemIcon>
                    {open && <ListItemText primary="Expand" />}
                  </ListItemButton>
                </List>
              )}

              {/* Sub-items for Analytics */}
              {item.text === 'Analytics' && open && (
                <List component="div" disablePadding>
                  <Collapse in={expandedItems.includes('analytics')} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {analyticsSubItems.map((subItem) => (
                        <ListItemButton
                          key={subItem.text}
                          sx={{
                            pl: 4,
                            minHeight: 40,
                            backgroundColor: location.pathname === subItem.path ? 'rgba(255,255,255,0.05)' : 'transparent',
                          }}
                          onClick={() => handleItemClick(subItem.path)}
                        >
                          <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center' }}>
                            {React.cloneElement(subItem.icon, { sx: { fontSize: 20, color: 'rgba(255,255,255,0.7)' } })}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.9)',
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                  <ListItemButton
                    onClick={() => handleExpandClick('analytics')}
                    sx={{ minHeight: 40, justifyContent: open ? 'initial' : 'center' }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                      {expandedItems.includes('analytics') ? <ExpandLess /> : <ExpandMore />}
                    </ListItemIcon>
                    {open && <ListItemText primary="Expand" />}
                  </ListItemButton>
                </List>
              )}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />

        {/* System Status */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Box sx={{ px: 2, pb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'block' }}>
                  System Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#4CAF50',
                        animation: 'pulse 2s infinite',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      AI Models: Online
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#2196F3',
                        animation: 'pulse 2s infinite 0.5s',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Data Feed: Active
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#FF9800',
                        animation: 'pulse 2s infinite 1s',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Predictions: Running
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Version Info */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                  v3.0.0 - Mount Meru SoyCo
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                  © 2024 All Rights Reserved
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Custom CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Drawer>
  );
};

export default Sidebar;

