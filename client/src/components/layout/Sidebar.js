import React from 'react';
import { 
  Drawer, 
  List, 
  Divider, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Toolbar,
  Box,
  alpha,
  useTheme,
  Typography,
  Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const drawerWidth = 240;

const Sidebar = ({ open, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      admin: false
    },
    {
      text: 'Surveys',
      icon: <AssignmentIcon />,
      path: '/surveys',
      admin: false
    },
    {
      text: 'Create Survey',
      icon: <AddCircleOutlineIcon />,
      path: '/surveys/create',
      admin: true
    },
    {
      text: 'Import Employees',
      icon: <GroupAddIcon />,
      path: '/employees/import',
      admin: true
    },
    {
      text: 'Reports',
      icon: <BarChartIcon />,
      path: '/reports',
      admin: false
    },
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      admin: false
    },
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/profile',
      admin: false
    }
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 600) {
      toggleDrawer();
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
          backdropFilter: 'blur(10px)',
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 0 20px ${alpha(theme.palette.common.black, 0.05)}`,
          ...(open ? { 
            transform: 'translateX(0)',
            transition: (theme) =>
              theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          } : { 
            transform: 'translateX(-100%)',
            transition: (theme) =>
              theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
          }),
        },
      }}
      open={open}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        minHeight: '56px !important',
        px: 2
      }}>
        <Box 
          component="img" 
          src={logo} 
          alt="Company Logo"
          sx={{ 
            maxWidth: '100%',
            height: 'auto',
            maxHeight: 36,
            objectFit: 'contain',
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.08))'
          }}
        />
      </Toolbar>
      <Box sx={{ overflow: 'auto', height: '100%' }}>

        {/* User Profile Section */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mr: 1.5,
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: '0.875rem' }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                {user?.role || 'user'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <List sx={{ px: 1.5, py: 0.5 }}>
          {menuItems.map((item) => (
            (!item.admin || (item.admin && isAdmin)) && (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton 
                  onClick={() => handleNavigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 1.5,
                    py: 0.75,
                    px: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      fontWeight: location.pathname === item.path ? 500 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
