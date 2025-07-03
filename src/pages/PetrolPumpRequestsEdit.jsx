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
  Divider,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Cancel as CancelIcon
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        {editedRequest && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Edit Petrol Pump Request: {editedRequest.customerName}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3} direction="column">
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <BusinessIcon />
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <FormControl fullWidth required>
                      <InputLabel>Company</InputLabel>
                      <Select
                        value={editedRequest?.company || ''}
                        label="Company"
                        onChange={(e) => handleEditChange('company', e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="HPCL">HPCL</MenuItem>
                        <MenuItem value="BPCL">BPCL</MenuItem>
                        <MenuItem value="IOCL">IOCL</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                    <TextField
                      fullWidth
                      label="Petrol Pump Name"
                      value={editedRequest?.customerName || ''}
                      onChange={(e) => handleEditChange('customerName', e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="SAP Code"
                      value={editedRequest?.sapCode || ''}
                      onChange={(e) => handleEditChange('sapCode', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                    <TextField
                      fullWidth
                      label="Dealer Name"
                      value={editedRequest?.dealerName || ''}
                      onChange={(e) => handleEditChange('dealerName', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                
                {/* Company Information and Contact Information Sections Side by Side */}
                <Grid container spacing={3}>
                  {/* Company Information Section - 80% */}
                  <Grid item xs={12} md={8.6} sx={{ width: '650px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                      <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Company Information
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
                        <TextField
                          fullWidth
                          label="Zone"
                          value={editedRequest?.zone || ''}
                          onChange={(e) => handleEditChange('zone', e.target.value)}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                        <TextField
                          fullWidth
                          label="Sales Area"
                          value={editedRequest?.salesArea || ''}
                          onChange={(e) => handleEditChange('salesArea', e.target.value)}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
                        <FormControl fullWidth>
                          <InputLabel>CO/CL/DO</InputLabel>
                          <Select
                            value={editedRequest?.coClDo || ''}
                            onChange={(e) => handleEditChange('coClDo', e.target.value)}
                            startAdornment={
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="CO">CO</MenuItem>
                            <MenuItem value="CL">CL</MenuItem>
                            <MenuItem value="DO">DO</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                        <TextField
                          fullWidth
                          label="Regional Office"
                          value={editedRequest?.regionalOffice || ''}
                          onChange={(e) => handleEditChange('regionalOffice', e.target.value)}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Contact Information Section - 20% */}
                  <Grid item xs={12} md={3.6} sx={{ width: '300px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                      <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Contact Information
                      </Typography>
                    </Box>

                    <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                      <TextField
                        fullWidth
                        label="Contact Details"
                        value={editedRequest?.contactDetails || ''}
                        onChange={(e) => handleEditChange('contactDetails', e.target.value)}
                        required
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Address Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                    <LocationIcon />
                    Address Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid container spacing={2}>
                <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="District"
                      value={editedRequest?.district || ''}
                      onChange={(e) => handleEditChange('district', e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      value={editedRequest?.pincode || ''}
                      onChange={(e) => handleEditChange('pincode', e.target.value)}
                      required
                      variant="outlined"
                      inputProps={{ maxLength: 6 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: '600px' }}>
                    <TextField
                      fullWidth
                      label="Address Line 1"
                      value={editedRequest?.addressLine1 || ''}
                      onChange={(e) => handleEditChange('addressLine1', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: '600px' }}>
                    <TextField
                      fullWidth
                      label="Address Line 2"
                      value={editedRequest?.addressLine2 || ''}
                      onChange={(e) => handleEditChange('addressLine2', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                </Grid>
                
                {/* Location Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                    <MyLocationIcon />
                    Location Coordinates
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={editedRequest?.latitude || ''}
                      onChange={(e) => handleEditChange('latitude', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MyLocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Enter latitude (e.g., 20.5937)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={editedRequest?.longitude || ''}
                      onChange={(e) => handleEditChange('longitude', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MyLocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Enter longitude (e.g., 78.9629)"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button 
                onClick={() => setEditDialogOpen(false)}
                variant="outlined"
                color="inherit"
                startIcon={<CancelIcon />}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEditedRequest} 
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ 
                  borderRadius: 2, 
                  px: 3,
                  boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
                }}
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