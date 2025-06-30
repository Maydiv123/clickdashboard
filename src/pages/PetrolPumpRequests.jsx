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
  TablePagination,
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
  Tabs,
  Tab,
  InputAdornment,
  Divider,
  MenuItem,
  Popover,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  padding: theme.spacing(1.5, 2),
  '&.MuiTableCell-head': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    color: theme.palette.text.primary,
    fontWeight: 600,
    whiteSpace: 'nowrap'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.background.default, 0.5),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  transition: 'background-color 0.2s ease',
}));

const SearchField = styled(TextField)(({ theme }) => ({
  width: '100%',
  maxWidth: 400,
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
    }
  }
}));

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
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Pending, 2: Approved, 3: Rejected
  const [editedRequest, setEditedRequest] = useState(null);
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
    latitude: 0,
    longitude: 0,
    status: 'pending',
    company: 'HPCL',
    regionalOffice: '',
    createdAt: new Date()
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    company: 'all',
    district: 'all',
    dateRange: 'all'
  });
  const [submittedByUser, setSubmittedByUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [tabValue, requests, searchQuery, filterOptions]);

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

  const fetchSubmittedByUser = async (userId) => {
    try {
      console.log('Fetching user data for userId:', userId);
      if (!userId) {
        console.log('No userId provided, skipping user fetch');
        return;
      }
      
      // First try to get the document directly by ID
      try {
        const userDocRef = doc(db, 'user_data', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data found by document ID:', userData);
          setSubmittedByUser(userData);
          return;
        } else {
          console.log('No user document found with ID:', userId);
        }
      } catch (error) {
        console.log('Error getting document by ID:', error);
      }
      
      // If direct document access fails, try querying by userId field
      const userRef = collection(db, 'user_data');
      const q = query(userRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log('User query result:', querySnapshot.size, 'documents found');
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('User data found by userId field:', userData);
        setSubmittedByUser(userData);
      } else {
        console.log('No user data found for userId:', userId);
        setSubmittedByUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setSubmittedByUser(null);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];
    
    console.log('Filtering requests:', {
      totalRequests: requests.length,
      tabValue,
      searchQuery,
      filterOptions
    });
    
    // Filter by status based on tab
    if (tabValue === 1) { // Pending
      filtered = filtered.filter(req => req.status === 'pending');
    } else if (tabValue === 2) { // Approved
      filtered = filtered.filter(req => req.status === 'approved');
    } else if (tabValue === 3) { // Rejected
      filtered = filtered.filter(req => req.status === 'rejected');
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        (req.customerName && req.customerName.toLowerCase().includes(query)) ||
        (req.district && req.district.toLowerCase().includes(query)) ||
        (req.company && req.company.toLowerCase().includes(query)) ||
        (req.dealerName && req.dealerName.toLowerCase().includes(query)) ||
        (req.sapCode && req.sapCode.toLowerCase().includes(query))
      );
    }

    // Filter by company
    if (filterOptions.company !== 'all') {
      filtered = filtered.filter(req => req.company === filterOptions.company);
    }

    // Filter by district
    if (filterOptions.district !== 'all') {
      filtered = filtered.filter(req => req.district === filterOptions.district);
    }

    // Filter by date range
    if (filterOptions.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(req => {
        const requestDate = req.createdAt?.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
        
        switch (filterOptions.dateRange) {
          case 'today':
            return requestDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return requestDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return requestDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    console.log('Filtered results:', filtered.length);
    setFilteredRequests(filtered);
  };

  const handleViewRequest = async (request) => {
    console.log('Viewing request:', request);
    setSelectedRequest(request);
    setViewDialogOpen(true);
    
    // Fetch user data if requestedByUserId exists
    if (request.requestedByUserId) {
      console.log('Request has requestedByUserId field:', request.requestedByUserId);
      await fetchSubmittedByUser(request.requestedByUserId);
    } else {
      console.log('Request does not have requestedByUserId field');
      setSubmittedByUser(null);
    }
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setEditedRequest({...request});
    setEditDialogOpen(true);
    handleCloseMenu();
  };

  const handleDeleteRequest = (request) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleCreateRequest = () => {
    setCreateDialogOpen(true);
    handleCloseMenu();
  };

  const handleApproveRequest = async (requestId) => {
    try {
      // Update the request status to approved
      const requestRef = doc(db, 'petrol_pump_requests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: auth.currentUser?.uid || 'unknown',
      });

      // Get the full request data
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Add to petrolPumps collection (changed from map_locations)
      const petrolPumpsRef = collection(db, 'petrolPumps');
      await addDoc(petrolPumpsRef, {
        zone: request.zone || '',
        salesArea: request.salesArea || '',
        coClDo: request.coClDo || '',
        district: request.district || '',
        sapCode: request.sapCode || '',
        customerName: request.customerName || '',
        location: request.location || '',
        addressLine1: request.addressLine1 || '',
        addressLine2: request.addressLine2 || '',
        pincode: request.pincode || '',
        dealerName: request.dealerName || '',
        contactDetails: request.contactDetails || '',
        latitude: request.latitude || 0,
        longitude: request.longitude || 0,
        company: request.company || 'HPCL',
        regionalOffice: request.regionalOffice || '',
        bannerImageUrl: request.bannerImageUrl || '',
        boardImageUrl: request.boardImageUrl || '',
        billSlipImageUrl: request.billSlipImageUrl || '',
        governmentDocImageUrl: request.governmentDocImageUrl || '',
        approvedAt: new Date().toISOString(),
        approvedBy: auth.currentUser?.uid || 'unknown',
        requestId: requestId,
        status: 'active',
        isVerified: true
      });

      showSnackbar('Request approved and added to petrol pumps successfully', 'success');
      fetchRequests();
      if (viewDialogOpen) setViewDialogOpen(false);
    } catch (error) {
      console.error('Error approving request:', error);
      showSnackbar(`Error approving request: ${error.message}`, 'error');
    }
  };

  const handleOpenRejectDialog = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleRejectRequest = async () => {
    try {
      if (!selectedRequest || !rejectReason.trim()) {
        showSnackbar('Please provide a reason for rejection', 'error');
        return;
      }
      
      const requestRef = doc(db, 'petrol_pump_requests', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: auth.currentUser?.uid || 'unknown',
        rejectionReason: rejectReason.trim()
      });

      showSnackbar('Request rejected successfully', 'success');
      fetchRequests();
      setRejectDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
      showSnackbar(`Error rejecting request: ${error.message}`, 'error');
    }
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

  const handleSaveNewRequest = async () => {
    try {
      const requestsRef = collection(db, 'petrol_pump_requests');
      await addDoc(requestsRef, {
        ...newRequest,
        status: 'pending',
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid || 'unknown'
      });

      showSnackbar('New request created successfully', 'success');
      fetchRequests();
      setCreateDialogOpen(false);
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
        latitude: 0,
        longitude: 0,
        status: 'pending',
        company: 'HPCL',
        regionalOffice: '',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating request:', error);
      showSnackbar(`Error creating request: ${error.message}`, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedRequest) return;
      
      const requestRef = doc(db, 'petrol_pump_requests', selectedRequest.id);
      await deleteDoc(requestRef);

      showSnackbar('Request deleted successfully', 'success');
      fetchRequests();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting request:', error);
      showSnackbar(`Error deleting request: ${error.message}`, 'error');
    }
  };

  const handleEditChange = (field, value) => {
    setEditedRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateChange = (field, value) => {
    setNewRequest(prev => ({
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenMenu = (event, request) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(request);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (field, value) => {
    console.log('Filter change:', field, value);
    setFilterOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    console.log('Clearing filters');
    setFilterOptions({
      company: 'all',
      district: 'all',
      dateRange: 'all'
    });
    setSearchQuery('');
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

  // Render request form fields for view/edit/create
  const renderRequestFields = (request, isEditable = false, onChange = null) => {
    return (
      <Grid container spacing={2} sx={{ mt: 1 }} direction="column">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company"
            value={request?.company || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('company', e.target.value) : undefined}
            select={isEditable}
          >
            {isEditable && ['HPCL', 'BPCL', 'IOCL'].map(option => (
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
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('customerName', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Zone"
            value={request?.zone || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('zone', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Sales Area"
            value={request?.salesArea || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('salesArea', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CO/CL/DO"
            value={request?.coClDo || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('coClDo', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Regional Office"
            value={request?.regionalOffice || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('regionalOffice', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="District"
            value={request?.district || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('district', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SAP Code"
            value={request?.sapCode || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('sapCode', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Address Line 1"
            value={request?.addressLine1 || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('addressLine1', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Address Line 2"
            value={request?.addressLine2 || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('addressLine2', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Pincode"
            value={request?.pincode || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('pincode', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Dealer Name"
            value={request?.dealerName || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('dealerName', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Details"
            value={request?.contactDetails || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('contactDetails', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Latitude"
            value={request?.latitude || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('latitude', e.target.value) : undefined}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Longitude"
            value={request?.longitude || ''}
            InputProps={{ readOnly: !isEditable }}
            onChange={isEditable ? (e) => onChange('longitude', e.target.value) : undefined}
          />
        </Grid>
        {!isEditable && request?.bannerImageUrl && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Banner Image</Typography>
            <Box component="img" src={request.bannerImageUrl} alt="Banner" 
              sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: '1px solid #eee' }} 
            />
          </Grid>
        )}
        {!isEditable && request?.boardImageUrl && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Board Image</Typography>
            <Box component="img" src={request.boardImageUrl} alt="Board" 
              sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: '1px solid #eee' }} 
            />
          </Grid>
        )}
        {!isEditable && request?.billSlipImageUrl && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Bill Slip Image</Typography>
            <Box component="img" src={request.billSlipImageUrl} alt="Bill Slip" 
              sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: '1px solid #eee' }} 
            />
          </Grid>
        )}
        {!isEditable && request?.governmentDocImageUrl && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Government Document</Typography>
            <Box component="img" src={request.governmentDocImageUrl} alt="Government Document" 
              sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: '1px solid #eee' }} 
            />
          </Grid>
        )}
        {!isEditable && request?.status === 'rejected' && request?.rejectionReason && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Rejection Reason"
              value={request.rejectionReason}
              InputProps={{ readOnly: true }}
              multiline
              rows={2}
              sx={{ mt: 2, bgcolor: 'error.light', borderRadius: 1 }}
            />
          </Grid>
        )}
      </Grid>
    );
  };

  const getStatusCount = (status) => {
    return requests.filter(req => req.status === status).length;
  };

  // Get unique companies and districts for filter options
  const getUniqueCompanies = () => {
    const companies = [...new Set(requests.map(req => req.company).filter(Boolean))];
    console.log('Unique companies:', companies);
    return companies;
  };

  const getUniqueDistricts = () => {
    const districts = [...new Set(requests.map(req => req.district).filter(Boolean))];
    console.log('Unique districts:', districts);
    return districts;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Petrol Pump Requests
        </Typography>
        
        {/* <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/petrol-pump-requests/create')}
          sx={{
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
          }}
        >
          Create New Request
        </Button> */}
      </Box>
      
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <SearchField
              placeholder="Search by customer name, district, company, dealer name, or SAP code..."
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ '.MuiTab-root': { fontWeight: 500, minWidth: 100 } }}
            >
              <Tab label={`All (${requests.length})`} />
              <Tab label={`Pending (${getStatusCount('pending')})`} />
              <Tab label={`Approved (${getStatusCount('approved')})`} />
              <Tab label={`Rejected (${getStatusCount('rejected')})`} />
            </Tabs>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleFilterClick}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 0.75
                }}
              >
                Filter
              </Button>
              {(filterOptions.company !== 'all' || filterOptions.district !== 'all' || filterOptions.dateRange !== 'all') && (
                <Button
                  variant="text"
                  onClick={clearFilters}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { p: 2, minWidth: 300 }
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>Filter Options</Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Company</InputLabel>
          <Select
            value={filterOptions.company}
            label="Company"
            onChange={(e) => handleFilterChange('company', e.target.value)}
          >
            <MenuItem value="all">All Companies</MenuItem>
            {getUniqueCompanies().map(company => (
              <MenuItem key={company} value={company}>{company}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>District</InputLabel>
          <Select
            value={filterOptions.district}
            label="District"
            onChange={(e) => handleFilterChange('district', e.target.value)}
          >
            <MenuItem value="all">All Districts</MenuItem>
            {getUniqueDistricts().map(district => (
              <MenuItem key={district} value={district}>{district}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={filterOptions.dateRange}
            label="Date Range"
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleFilterClose}
            fullWidth
          >
            Apply Filters
          </Button>
        </Box>
      </Popover>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="requests table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Customer Name</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>District</StyledTableCell>
                <StyledTableCell>Requested On</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredRequests
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((request) => (
                  <StyledTableRow key={request.id}>
                    <StyledTableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {request.customerName}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>{request.company}</StyledTableCell>
                    <StyledTableCell>{request.district}</StyledTableCell>
                    <StyledTableCell>{formatDate(request.createdAt)}</StyledTableCell>
                    <StyledTableCell>
                      <StatusChip
                        label={request.status}
                        status={request.status}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <IconButton
                        onClick={() => handleViewRequest(request)}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {!loading && filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No requests found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {searchQuery ? "Try adjusting your search query" : "No requests in this category"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRequests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

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
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>Petrol Pump Request Details</Typography>
                <StatusChip
                  label={selectedRequest.status}
                  status={selectedRequest.status}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Submitted By Information */}
              {submittedByUser && (
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                      Submitted By
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Name: {submittedByUser.firstName} {submittedByUser.lastName}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Mobile: {submittedByUser.mobile || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            User Type: {submittedByUser.userType || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Submitted: {formatDate(selectedRequest.createdAt)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Request Details */}
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                Request Details
              </Typography>
              {renderRequestFields(selectedRequest)}
            </DialogContent>
            <DialogActions>
              {selectedRequest.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    color="success"
                    startIcon={<CheckIcon />}
                    variant="contained"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleOpenRejectDialog(selectedRequest)}
                    color="error"
                    startIcon={<CloseIcon />}
                    variant="outlined"
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
              {renderRequestFields(editedRequest, true, handleEditChange)}
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

      {/* Create Request Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create New Petrol Pump Request
        </DialogTitle>
        <DialogContent>
          {renderRequestFields(newRequest, true, handleCreateChange)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNewRequest} 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
          >
            Create Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete Request
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the request for "{selectedRequest?.customerName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog with Reason */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Reject Request
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this request:
          </Typography>
          <TextField
            autoFocus
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            error={rejectReason.trim() === ''}
            helperText={rejectReason.trim() === '' ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectRequest} 
            color="error"
            disabled={rejectReason.trim() === ''}
            variant="contained"
          >
            Reject Request
          </Button>
        </DialogActions>
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