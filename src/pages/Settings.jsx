import { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
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
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application Name"
                  value={settings.appName}
                  onChange={(e) => handleSettingChange('appName', e.target.value)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Team Size"
                  type="number"
                  value={settings.maxTeamSize}
                  onChange={(e) => handleSettingChange('maxTeamSize', parseInt(e.target.value, 10))}
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Upload Size (MB)"
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value, 10))}
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Maintenance Mode"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* User Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Settings
            </Typography>
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
          </Paper>
        </Grid>
        
        {/* Contact Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notification Email"
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Support Email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Support Phone"
                  value={settings.supportPhone}
                  onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 