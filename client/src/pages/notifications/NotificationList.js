import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { notificationApi } from '../../services/api';
import { toast } from 'react-toastify';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    debugger;
    setLoading(true);
    try {
      const result = await notificationApi.getNotifications();
      if (result.success) {
        setNotifications(result.data);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('An error occurred while fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await notificationApi.markNotificationRead(notificationId);
      if (result.success) {
        setNotifications(notifications.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        ));
        toast.success('Notification marked as read');
      } else {
        toast.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('An error occurred while updating notification');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await notificationApi.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(notifications.filter(notif => notif._id !== notificationId));
        toast.success('Notification deleted');
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('An error occurred while deleting notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationApi.markAllAsRead();
      if (result.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        toast.success('All notifications marked as read');
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('An error occurred while updating notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'survey_invitation':
        return <AssignmentIcon color="primary" />;
      case 'consent_request':
        return <EmailIcon color="info" />;
      case 'survey_reminder':
        return <NotificationsIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'survey_invitation':
        return 'Survey Invitation';
      case 'consent_request':
        return 'Consent Request';
      case 'survey_reminder':
        return 'Survey Reminder';
      default:
        return 'Notification';
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Notifications
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} unread`} 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Box>

        {notifications.length > 0 ? (
          <Paper sx={{ width: '100%' }}>
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {notification.title}
                          </Typography>
                          <Chip 
                            label={getNotificationTypeLabel(notification.type)} 
                            size="small" 
                            variant="outlined"
                          />
                          {!notification.read && (
                            <Chip 
                              label="New" 
                              color="primary" 
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {!notification.read && (
                        <IconButton
                          edge="end"
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(notification._id)}
                          color="primary"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteNotification(notification._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Notifications
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You don't have any notifications at the moment.
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default NotificationList;
