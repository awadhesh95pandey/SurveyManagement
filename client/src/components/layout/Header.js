import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Box,
  Badge,
  alpha,
  useTheme,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Fade,
  Slide,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ open, toggleDrawer }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenu = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleViewNotifications = () => {
    navigate('/notifications');
    handleNotificationClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        backdropFilter: 'blur(10px)',
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        ...(open && {
          marginLeft: 240,
          width: `calc(100% - ${240}px)`,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }),
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Tooltip title={open ? "Collapse Sidebar" : "Expand Sidebar"} arrow>
          <IconButton
            color="inherit"
            aria-label={open ? "collapse drawer" : "expand drawer"}
            onClick={toggleDrawer}
            edge="start"
            sx={{ 
              mr: 2,
              position: 'relative',
              '&:hover': {
                backgroundColor: alpha('#ffffff', 0.15),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeftIcon
                sx={{
                  position: 'absolute',
                  opacity: open ? 1 : 0,
                  transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 24,
                }}
              />
              <ChevronRightIcon
                sx={{
                  position: 'absolute',
                  opacity: open ? 0 : 1,
                  transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 24,
                }}
              />
            </Box>
          </IconButton>
        </Tooltip>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <SecurityIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #ffffff, #f0f0f0)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Survey Management System
          </Typography>
        </Box>

        {/* Notifications */}
        <Box sx={{ mr: 2 }}>
          <Tooltip title="Notifications" arrow>
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationMenu}
              sx={{
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.15),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Badge 
                badgeContent={0} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    height: 18,
                    minWidth: 18,
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            id="notification-menu"
            anchorEl={notificationAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 200 }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                minWidth: 280,
                maxWidth: 320,
                mt: 1,
                overflow: 'hidden',
                background: 'white',
              }
            }}
          >
            <Box sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
              p: 2,
              textAlign: 'center',
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: '1rem',
                }}
              >
                Notifications
              </Typography>
            </Box>
            
            <Divider sx={{ my: 0 }} />
            
            <Box sx={{ py: 1 }}>
              <MenuItem 
                onClick={handleViewNotifications}
                sx={{
                  py: 1.5,
                  px: 2,
                  mx: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <NotificationsIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="View All Notifications" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                />
              </MenuItem>
            </Box>
          </Menu>
        </Box>

        {/* User Menu */}
        <Box>
          <Tooltip title="User Menu" arrow>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.15),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {user?.name ? (
                <Avatar 
                  sx={{ 
                    bgcolor: alpha('#ffffff', 0.2),
                    color: 'white',
                    fontWeight: 600,
                    border: `2px solid ${alpha('#ffffff', 0.3)}`,
                    width: 36,
                    height: 36,
                    fontSize: '0.9rem',
                    '&:hover': {
                      border: `2px solid ${alpha('#ffffff', 0.5)}`,
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <AccountCircleIcon sx={{ fontSize: 32 }} />
              )}
            </IconButton>
          </Tooltip>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 200 }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                minWidth: 280,
                maxWidth: 320,
                mt: 1,
                overflow: 'hidden',
                background: 'white',
              }
            }}
          >
            {/* User Profile Section */}
            <Box sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
              p: 3,
              pb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 600,
                    width: 48,
                    height: 48,
                    fontSize: '1.2rem',
                    mr: 2,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary,
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {user?.name || 'User'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                      mt: 0.5,
                    }}
                  >
                    {user?.email || 'user@example.com'}
                  </Typography>
                </Box>
              </Box>
              
              <Chip 
                label={user?.role || 'user'} 
                size="small" 
                sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }} 
              />
            </Box>
            
            <Divider sx={{ my: 0 }} />
            
            {/* Menu Items */}
            <Box sx={{ py: 1 }}>
              <MenuItem 
                onClick={handleProfile}
                sx={{
                  py: 1.5,
                  px: 2,
                  mx: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Profile" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                />
              </MenuItem>
              
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2,
                  mx: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LogoutIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                />
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

