import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Stack,
  Snackbar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
  LocalGasStation as PetrolPumpIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function Settings() {
  const [settings, setSettings] = useState({
    // General Settings
    appName: 'MayDIV Click App',
    supportEmail: 'support@maydiv.com',
    supportPhone: '+91 9876543210',
    
    // User Management
    allowRegistration: true,
    requireEmailVerification: false,
    autoApproveUsers: true,
    maxTeamSize: 10,
    allowTeamCreation: true,
    
    // Petrol Pump Settings
    autoVerifyPumps: false,
    allowPumpCreation: true,
    requirePumpVerification: true,
    maxUploadSize: 5, // MB
    
    // System Settings
    maintenanceMode: false,
    enableNotifications: true,
    enableAnalytics: true,
    dataRetentionDays: 365,
    
    // Import/Export Settings
    allowExcelImport: true,
    allowDataExport: true,
    backupFrequency: 'weekly'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPumps: 0,
    totalTeams: 0,
    totalPhotos: 0,
    storageUsed: 0
  });
  
  // Dialogs
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    users: true,
    petrolPumps: true,
    teams: true,
    photos: false,
    petrolPumpRequests: false
  });

  // Fetch settings and statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setSettings(prev => ({ ...prev, ...settingsDoc.data() }));
        }
        
        // Fetch statistics
        const [usersSnapshot, pumpsSnapshot, teamsSnapshot, photosSnapshot] = await Promise.all([
          getDocs(collection(db, 'user_data')),
          getDocs(collection(db, 'petrolPumps')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'photos'))
        ]);
        
        setStats({
          totalUsers: usersSnapshot.size,
          totalPumps: pumpsSnapshot.size,
          totalTeams: teamsSnapshot.size,
          totalPhotos: photosSnapshot.size,
          storageUsed: Math.round((usersSnapshot.size + pumpsSnapshot.size + teamsSnapshot.size + photosSnapshot.size) * 0.1) // Rough estimate
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading settings',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle settings change
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Error saving settings!',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Export data functionality
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const workbook = XLSX.utils.book_new();
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Export Users
      if (exportOptions.users) {
        const usersSnapshot = await getDocs(collection(db, 'user_data'));
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            'User ID': doc.id,
            'First Name': data.firstName || '',
            'Last Name': data.lastName || '',
            'Email': data.email || '',
            'Mobile': data.mobile || '',
            'User Type': data.userType || '',
            'MPIN': data.mpin || '',
            'Preferred Companies': data.preferredCompanies?.join(', ') || '',
            'Created At': data.createdAt?.toDate?.()?.toLocaleString() || data.createdAt || '',
            'Status': data.status || 'active'
          };
        });
        
        if (usersData.length > 0) {
          const usersSheet = XLSX.utils.json_to_sheet(usersData);
          XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
        }
      }
      
      // Export Petrol Pumps
      if (exportOptions.petrolPumps) {
        const pumpsSnapshot = await getDocs(collection(db, 'petrolPumps'));
        const pumpsData = pumpsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            'Pump ID': doc.id,
            'Customer Name': data.customerName || '',
            'Dealer Name': data.dealerName || '',
            'Company': data.company || '',
            'SAP Code': data.sapCode || '',
            'Zone': data.zone || '',
            'Sales Area': data.salesArea || '',
            'CO/CL/DO': data.coClDo || '',
            'Regional Office': data.regionalOffice || '',
            'Address Line 1': data.addressLine1 || '',
            'Address Line 2': data.addressLine2 || '',
            'Address Line 3': data.addressLine3 || '',
            'Address Line 4': data.addressLine4 || '',
            'District': data.district || '',
            'Pincode': data.pincode || '',
            'Contact Details': data.contactDetails || '',
            'Latitude': data.latitude || '',
            'Longitude': data.longitude || '',
            'Imported At': data.importedAt?.toDate?.()?.toLocaleString() || data.importedAt || ''
          };
        });
        
        if (pumpsData.length > 0) {
          const pumpsSheet = XLSX.utils.json_to_sheet(pumpsData);
          XLSX.utils.book_append_sheet(workbook, pumpsSheet, 'Petrol Pumps');
        }
      }
      
      // Export Teams
      if (exportOptions.teams) {
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const teamsData = teamsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            'Team ID': doc.id,
            'Team Name': data.teamName || '',
            'Team Code': data.teamCode || '',
            'Owner ID': data.ownerId || '',
            'Member Count': data.memberCount || 0,
            'Active Members': data.activeMembers || 0,
            'Pending Requests': data.pendingRequests || 0,
            'Total Uploads': data.teamStats?.totalUploads || 0,
            'Total Distance': data.teamStats?.totalDistance || 0,
            'Total Visits': data.teamStats?.totalVisits || 0,
            'Fuel Consumption': data.teamStats?.fuelConsumption || 0,
            'Created At': data.createdAt?.toDate?.()?.toLocaleString() || data.createdAt || ''
          };
        });
        
        if (teamsData.length > 0) {
          const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
          XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Teams');
        }
      }
      
      // Export Petrol Pump Requests
      if (exportOptions.petrolPumpRequests) {
        const requestsSnapshot = await getDocs(collection(db, 'petrolPumpRequests'));
        const requestsData = requestsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            'Request ID': doc.id,
            'User ID': data.userId || '',
            'Pump ID': data.pumpId || '',
            'Status': data.status || '',
            'Request Type': data.requestType || '',
            'Description': data.description || '',
            'Created At': data.createdAt?.toDate?.()?.toLocaleString() || data.createdAt || ''
          };
        });
        
        if (requestsData.length > 0) {
          const requestsSheet = XLSX.utils.json_to_sheet(requestsData);
          XLSX.utils.book_append_sheet(workbook, requestsSheet, 'Pump Requests');
        }
      }
      
      // Download the file
      const fileName = `maydiv_data_export_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setSnackbar({
        open: true,
        message: `Data exported successfully as ${fileName}`,
        severity: 'success'
      });
      
      setExportDialogOpen(false);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting data!',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    try {
      // Delete all collections
      const collections = ['user_data', 'petrolPumps', 'teams', 'photos', 'petrolPumpRequests'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
      
      setSnackbar({
        open: true,
        message: 'All data cleared successfully!',
        severity: 'success'
      });
      
      // Refresh stats
      setStats({
        totalUsers: 0,
        totalPumps: 0,
        totalTeams: 0,
        totalPhotos: 0,
        storageUsed: 0
      });
      
    } catch (error) {
      console.error('Error clearing data:', error);
      setSnackbar({
        open: true,
        message: 'Error clearing data!',
        severity: 'error'
      });
    }
    setClearDataDialogOpen(false);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        System Settings
      </Typography>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PetrolPumpIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalPumps}</Typography>
                  <Typography variant="body2" color="text.secondary">Petrol Pumps</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalTeams}</Typography>
                  <Typography variant="body2" color="text.secondary">Teams</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.storageUsed}MB</Typography>
                  <Typography variant="body2" color="text.secondary">Storage Used</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" />
              General Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="App Name"
                value={settings.appName}
                onChange={(e) => handleSettingChange('appName', e.target.value)}
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Support Email"
                value={settings.supportEmail}
                onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Support Phone"
                value={settings.supportPhone}
                onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Backup Frequency</InputLabel>
                <Select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  label="Backup Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        </Grid>

        {/* User Management Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              User Management
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
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
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowTeamCreation}
                    onChange={(e) => handleSettingChange('allowTeamCreation', e.target.checked)}
                    color="primary"
                  />
                }
                label="Allow Team Creation"
              />
              
              <TextField
                fullWidth
                label="Maximum Team Size"
                type="number"
                value={settings.maxTeamSize}
                onChange={(e) => handleSettingChange('maxTeamSize', parseInt(e.target.value) || 10)}
                variant="outlined"
                inputProps={{ min: 1, max: 50 }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Petrol Pump Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PetrolPumpIcon color="primary" />
              Petrol Pump Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowPumpCreation}
                    onChange={(e) => handleSettingChange('allowPumpCreation', e.target.checked)}
                    color="primary"
                  />
                }
                label="Allow Pump Creation"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoVerifyPumps}
                    onChange={(e) => handleSettingChange('autoVerifyPumps', e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto-Verify New Pumps"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requirePumpVerification}
                    onChange={(e) => handleSettingChange('requirePumpVerification', e.target.checked)}
                    color="primary"
                  />
                }
                label="Require Pump Verification"
              />
              
              <TextField
                fullWidth
                label="Max Upload Size (MB)"
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value) || 5)}
                variant="outlined"
                inputProps={{ min: 1, max: 50 }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="primary" />
              System Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
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
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableNotifications}
                    onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableAnalytics}
                    onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Analytics"
              />
              
              <TextField
                fullWidth
                label="Data Retention (Days)"
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value) || 365)}
                variant="outlined"
                inputProps={{ min: 30, max: 3650 }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon color="primary" />
              Data Management
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => setExportDialogOpen(true)}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  Export Data
                </Button>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => window.location.href = '/excel-import'}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  Import Data
                </Button>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setClearDataDialogOpen(true)}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  Clear All Data
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
      
      {/* Export Data Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon color="primary" />
            Export Data
          </Box>
          <IconButton onClick={() => setExportDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Select which data you want to export:
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.users}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, users: e.target.checked }))}
                />
              }
              label={`Users (${stats.totalUsers} records)`}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.petrolPumps}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, petrolPumps: e.target.checked }))}
                />
              }
              label={`Petrol Pumps (${stats.totalPumps} records)`}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.teams}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, teams: e.target.checked }))}
                />
              }
              label={`Teams (${stats.totalTeams} records)`}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.petrolPumpRequests}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, petrolPumpRequests: e.target.checked }))}
                />
              }
              label="Petrol Pump Requests"
            />
          </FormGroup>
          
          {exportLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Exporting data...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleExportData} 
            variant="contained"
            disabled={exportLoading || (!exportOptions.users && !exportOptions.petrolPumps && !exportOptions.teams && !exportOptions.petrolPumpRequests)}
            startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {exportLoading ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Clear Data Confirmation Dialog */}
      <Dialog open={clearDataDialogOpen} onClose={() => setClearDataDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Clear All Data
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all data? This action cannot be undone and will delete:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary={`${stats.totalUsers} users`} />
            </ListItem>
            <ListItem>
              <ListItemIcon><PetrolPumpIcon /></ListItemIcon>
              <ListItemText primary={`${stats.totalPumps} petrol pumps`} />
            </ListItem>
            <ListItem>
              <ListItemIcon><BusinessIcon /></ListItemIcon>
              <ListItemText primary={`${stats.totalTeams} teams`} />
            </ListItem>
            <ListItem>
              <ListItemIcon><StorageIcon /></ListItemIcon>
              <ListItemText primary={`${stats.totalPhotos} photos`} />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDataDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearAllData} color="error" variant="contained">
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
      
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