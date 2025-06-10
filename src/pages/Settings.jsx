import { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Divider, 
  Switch, 
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Stack,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Tune as TuneIcon,
  Language as LanguageIcon,
  ColorLens as ThemeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  overflow: 'visible',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 8px 25px rgba(0,0,0,0.09)',
  }
}));

const SettingsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1.5),
    fontSize: 24
  }
}));

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [tabValue, setTabValue] = useState(0);
  
  // Application settings
  const [settings, setSettings] = useState({
    appName: 'Click App',
    allowRegistration: true,
    requireEmailVerification: true,
    autoApproveUsers: false,
    autoVerifyPumps: false,
    maintenanceMode: false,
    maxTeamSize: 10,
    maxUploadSize: 5,
    notificationEmail: '',
    supportEmail: '',
    supportPhone: ''
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settingsRef = doc(db, 'settings', 'appSettings');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings({
            ...settings,
            ...settingsSnap.data()
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load settings. Please try again.',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Handle settings change
  const handleSettingChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'appSettings');
      await setDoc(settingsRef, settings, { merge: true });
      
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Settings
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
      
      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            px: 2, 
            pt: 1, 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { 
              minWidth: 120, 
              fontWeight: 500, 
              textTransform: 'none', 
              fontSize: '0.95rem' 
            }
          }}
        >
          <Tab icon={<TuneIcon />} label="General" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<StorageIcon />} label="System" iconPosition="start" />
          <Tab icon={<EmailIcon />} label="Contact" iconPosition="start" />
        </Tabs>
      </Card>
      
      <Grid container spacing={3}>
        {/* General Settings */}
        {tabValue === 0 && (
          <>
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent sx={{ p: 3 }}>
                  <SettingsHeader>
                    <TuneIcon />
                    <Typography variant="h6" fontWeight={600}>
                      General Settings
                    </Typography>
                  </SettingsHeader>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Application Name"
                      value={settings.appName}
                      onChange={(e) => handleSettingChange('appName', e.target.value)}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.maintenanceMode}
                          onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography>Maintenance Mode</Typography>
                          {settings.maintenanceMode && 
                            <Chip label="Active" size="small" color="warning" />
                          }
                        </Stack>
                      }
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent sx={{ p: 3 }}>
                  <SettingsHeader>
                    <ThemeIcon />
                    <Typography variant="h6" fontWeight={600}>
                      Appearance
                    </Typography>
                  </SettingsHeader>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Configure the visual appearance of your application.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
                      Light Mode
                    </Button>
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
                      Dark Mode
                    </Button>
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
                      System
                    </Button>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          </>
        )}
        
        {/* Security Settings */}
        {tabValue === 1 && (
          <Grid item xs={12}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <SettingsHeader>
                  <SecurityIcon />
                  <Typography variant="h6" fontWeight={600}>
                    Security Settings
                  </Typography>
                </SettingsHeader>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowRegistration}
                          onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Allow New User Registration"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.requireEmailVerification}
                          onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Require Email Verification"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoApproveUsers}
                          onChange={(e) => handleSettingChange('autoApproveUsers', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Auto-Approve New Users"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoVerifyPumps}
                          onChange={(e) => handleSettingChange('autoVerifyPumps', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Auto-Verify New Petrol Pumps"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        )}
        
        {/* Notification Settings */}
        {tabValue === 2 && (
          <Grid item xs={12}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <SettingsHeader>
                  <NotificationsIcon />
                  <Typography variant="h6" fontWeight={600}>
                    Notification Settings
                  </Typography>
                </SettingsHeader>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Notification Email"
                      value={settings.notificationEmail}
                      onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Notifications about system events will be sent to this email.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!settings.emailNotifications}
                            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Email Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!settings.pushNotifications}
                            onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Push Notifications"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        )}
        
        {/* System Settings */}
        {tabValue === 3 && (
          <Grid item xs={12}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <SettingsHeader>
                  <StorageIcon />
                  <Typography variant="h6" fontWeight={600}>
                    System Settings
                  </Typography>
                </SettingsHeader>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Team Size"
                      type="number"
                      value={settings.maxTeamSize}
                      onChange={(e) => handleSettingChange('maxTeamSize', parseInt(e.target.value, 10))}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 1 }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Maximum number of members allowed in a team.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Upload Size (MB)"
                      type="number"
                      value={settings.maxUploadSize}
                      onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value, 10))}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 1 }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Maximum file size for uploads in megabytes.
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        )}
        
        {/* Contact Settings */}
        {tabValue === 4 && (
          <Grid item xs={12}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <SettingsHeader>
                  <EmailIcon />
                  <Typography variant="h6" fontWeight={600}>
                    Contact Information
                  </Typography>
                </SettingsHeader>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      This email will be displayed to users for support inquiries.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Phone"
                      value={settings.supportPhone}
                      onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      This phone number will be displayed to users for support inquiries.
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        )}
      </Grid>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 