import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Alert,
  Snackbar,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const PetrolPumpRequestsCreate = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [newRequest, setNewRequest] = useState({
    customerName: '',
    location: '',
    zone: '',
    salesArea: '',
    coClDo: '',
    district: '',
    sapCode: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    dealerName: '',
    contactDetails: '',
    latitude: '',
    longitude: '',
    status: 'pending',
    company: 'HPCL',
    regionalOffice: '',
    createdAt: new Date()
  });

  const handleCreateChange = (field, value) => {
    setNewRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveNewRequest = async () => {
    try {
      // Basic validation
      if (!newRequest.customerName || !newRequest.company) {
        showSnackbar('Customer name and company are required', 'error');
        return;
      }

      const requestsRef = collection(db, 'petrol_pump_requests');
      await addDoc(requestsRef, {
        ...newRequest,
        latitude: Number(newRequest.latitude) || 0,
        longitude: Number(newRequest.longitude) || 0,
        status: 'pending',
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid || 'unknown'
      });

      showSnackbar('New request created successfully', 'success');
      
      // Reset form
      setNewRequest({
        customerName: '',
        location: '',
        zone: '',
        salesArea: '',
        coClDo: '',
        district: '',
        sapCode: '',
        addressLine1: '',
        addressLine2: '',
        pincode: '',
        dealerName: '',
        contactDetails: '',
        latitude: '',
        longitude: '',
        status: 'pending',
        company: 'HPCL',
        regionalOffice: '',
        createdAt: new Date()
      });
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/petrol-pump-requests');
      }, 2000);
    } catch (error) {
      console.error('Error creating request:', error);
      showSnackbar(`Error creating request: ${error.message}`, 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/petrol-pump-requests')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Create New Petrol Pump Request
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, boxShadow: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Company"
              value={newRequest.company}
              onChange={(e) => handleCreateChange('company', e.target.value)}
              select
            >
              {['HPCL', 'BPCL', 'IOCL'].map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Customer Name"
              value={newRequest.customerName}
              onChange={(e) => handleCreateChange('customerName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Zone"
              value={newRequest.zone}
              onChange={(e) => handleCreateChange('zone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sales Area"
              value={newRequest.salesArea}
              onChange={(e) => handleCreateChange('salesArea', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CO/CL/DO"
              value={newRequest.coClDo}
              onChange={(e) => handleCreateChange('coClDo', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Regional Office"
              value={newRequest.regionalOffice}
              onChange={(e) => handleCreateChange('regionalOffice', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="District"
              value={newRequest.district}
              onChange={(e) => handleCreateChange('district', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SAP Code"
              value={newRequest.sapCode}
              onChange={(e) => handleCreateChange('sapCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Address Line 1"
              value={newRequest.addressLine1}
              onChange={(e) => handleCreateChange('addressLine1', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Address Line 2"
              value={newRequest.addressLine2}
              onChange={(e) => handleCreateChange('addressLine2', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pincode"
              value={newRequest.pincode}
              onChange={(e) => handleCreateChange('pincode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Dealer Name"
              value={newRequest.dealerName}
              onChange={(e) => handleCreateChange('dealerName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Details"
              value={newRequest.contactDetails}
              onChange={(e) => handleCreateChange('contactDetails', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Latitude"
              value={newRequest.latitude}
              onChange={(e) => handleCreateChange('latitude', e.target.value)}
              type="number"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Longitude"
              value={newRequest.longitude}
              onChange={(e) => handleCreateChange('longitude', e.target.value)}
              type="number"
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/petrol-pump-requests')}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveNewRequest}
            >
              Create Request
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
};

export default PetrolPumpRequestsCreate; 