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
  Snackbar
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { styled } from '@mui/material/styles';

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: 
    status === 'pending' ? theme.palette.warning.main :
    status === 'approved' ? theme.palette.success.main :
    theme.palette.error.main,
  color: 'white',
  fontWeight: 600
}));

const PetrolPumpRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'petrolPumpRequests');
      const q = query(requestsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showSnackbar('Error fetching requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const requestRef = doc(db, 'petrolPumpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Add to petrol pumps collection
      const request = requests.find(r => r.id === requestId);
      const petrolPumpRef = collection(db, 'petrolPumps');
      await addDoc(petrolPumpRef, {
        ...request,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      showSnackbar('Request approved successfully', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      showSnackbar('Error approving request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const requestRef = doc(db, 'petrolPumpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      showSnackbar('Request rejected successfully', 'success');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showSnackbar('Error rejecting request', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Petrol Pump Requests
        </Typography>
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
                <TableCell>Location</TableCell>
                <TableCell>Requested On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.customerName}</TableCell>
                  <TableCell>{request.location}</TableCell>
                  <TableCell>{formatDate(request.timestamp)}</TableCell>
                  <TableCell>
                    <StatusChip
                      label={request.status}
                      status={request.status}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleViewRequest(request)}
                      color="primary"
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {request.status === 'pending' && (
                      <>
                        <IconButton
                          onClick={() => handleApproveRequest(request.id)}
                          color="success"
                          size="small"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRejectRequest(request.id)}
                          color="error"
                          size="small"
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Request Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              Petrol Pump Request Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={selectedRequest.customerName}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={selectedRequest.location}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Zone"
                    value={selectedRequest.zone}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sales Area"
                    value={selectedRequest.salesArea}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="District"
                    value={selectedRequest.district}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SAP Code"
                    value={selectedRequest.sapCode}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={`${selectedRequest.addressLine1}, ${selectedRequest.addressLine2}, ${selectedRequest.addressLine3}, ${selectedRequest.addressLine4}`}
                    InputProps={{ readOnly: true }}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={selectedRequest.pincode}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dealer Name"
                    value={selectedRequest.dealerName}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Details"
                    value={selectedRequest.contactDetails}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coordinates"
                    value={`${selectedRequest.latitude}, ${selectedRequest.longitude}`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedRequest.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    color="success"
                    startIcon={<CheckIcon />}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    color="error"
                    startIcon={<CloseIcon />}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
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

export default PetrolPumpRequests; 