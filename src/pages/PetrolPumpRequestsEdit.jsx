import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: 
    status === 'pending' ? theme.palette.warning.main :
    status === 'approved' ? theme.palette.success.main :
    theme.palette.error.main,
  color: 'white',
  fontWeight: 600
}));

const PetrolPumpRequestsEdit = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedRequest, setEditedRequest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'petrol_pump_requests');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showSnackbar(`Error fetching requests: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = (request) => {
    setEditedRequest({...request});
    setEditDialogOpen(true);
  };

  const handleSaveEditedRequest = async () => {
    try {
      if (!editedRequest) return;
      
      const requestRef = doc(db, 'petrol_pump_requests', editedRequest.id);
      await updateDoc(requestRef, {
        customerName: editedRequest.customerName,
        location: editedRequest.location,
        zone: editedRequest.zone,
        salesArea: editedRequest.salesArea,
        coClDo: editedRequest.coClDo,
        district: editedRequest.district,
        sapCode: editedRequest.sapCode,
        addressLine1: editedRequest.addressLine1,
        addressLine2: editedRequest.addressLine2,
        pincode: editedRequest.pincode,
        dealerName: editedRequest.dealerName,
        contactDetails: editedRequest.contactDetails,
        latitude: Number(editedRequest.latitude),
        longitude: Number(editedRequest.longitude),
        company: editedRequest.company,
        regionalOffice: editedRequest.regionalOffice,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid || 'unknown'
      });

      showSnackbar('Request updated successfully', 'success');
      fetchRequests();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating request:', error);
      showSnackbar(`Error updating request: ${error.message}`, 'error');
    }
  };

  const handleEditChange = (field, value) => {
    setEditedRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    
    // If it's a Firestore timestamp
    if (date && date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleString();
    }
    
    // If it's a date string
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }
    
    // If it's already a Date
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    
    return 'Invalid date';
  };

  // Render request form fields for edit
  const renderRequestFields = (request) => {
    return (
      <Grid container spacing={2} sx={{ mt: 1 }} direction="column">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company"
            value={request?.company || ''}
            onChange={(e) => handleEditChange('company', e.target.value)}
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
            label="Customer Name"
            value={request?.customerName || ''}
            onChange={(e) => handleEditChange('customerName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Zone"
            value={request?.zone || ''}
            onChange={(e) => handleEditChange('zone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Sales Area"
            value={request?.salesArea || ''}
            onChange={(e) => handleEditChange('salesArea', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CO/CL/DO"
            value={request?.coClDo || ''}
            onChange={(e) => handleEditChange('coClDo', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Regional Office"
            value={request?.regionalOffice || ''}
            onChange={(e) => handleEditChange('regionalOffice', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="District"
            value={request?.district || ''}
            onChange={(e) => handleEditChange('district', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SAP Code"
            value={request?.sapCode || ''}
            onChange={(e) => handleEditChange('sapCode', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Address Line 1"
            value={request?.addressLine1 || ''}
            onChange={(e) => handleEditChange('addressLine1', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Address Line 2"
            value={request?.addressLine2 || ''}
            onChange={(e) => handleEditChange('addressLine2', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Pincode"
            value={request?.pincode || ''}
            onChange={(e) => handleEditChange('pincode', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Dealer Name"
            value={request?.dealerName || ''}
            onChange={(e) => handleEditChange('dealerName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Details"
            value={request?.contactDetails || ''}
            onChange={(e) => handleEditChange('contactDetails', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Latitude"
            value={request?.latitude || ''}
            onChange={(e) => handleEditChange('latitude', e.target.value)}
            type="number"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Longitude"
            value={request?.longitude || ''}
            onChange={(e) => handleEditChange('longitude', e.target.value)}
            type="number"
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/petrol-pump-requests')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Edit Petrol Pump Requests
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchRequests}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>District</TableCell>
                <TableCell>Requested On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow 
                  key={request.id}
                  hover
                  onClick={() => handleEditRequest(request)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{request.customerName}</TableCell>
                  <TableCell>{request.company}</TableCell>
                  <TableCell>{request.district}</TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>
                    <StatusChip
                      label={request.status}
                      status={request.status}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRequest(request);
                      }}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Request Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {editedRequest && (
          <>
            <DialogTitle>
              Edit Petrol Pump Request
            </DialogTitle>
            <DialogContent>
              {renderRequestFields(editedRequest)}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEditedRequest} 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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

export default PetrolPumpRequestsEdit; 