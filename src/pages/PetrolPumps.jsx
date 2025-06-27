import React, { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Stack,
  LinearProgress,
  MenuItem,
  Fab,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Tooltip,
  CardMedia,
  CardActionArea,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  CheckCircle as VerifiedIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  MoreVert as MoreVertIcon,
  LocalGasStation as PumpIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Map as MapIcon,
  Clear as ClearIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, orderBy, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Styled components
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

const PumpCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(status === 'verified' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.dark,
    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
  }),
  ...(status === 'unverified' && {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    color: theme.palette.warning.dark,
    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
  }),
  ...(status === 'active' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.dark,
    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
  }),
  ...(status === 'inactive' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.dark,
    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
  })
}));

// Update the mapContainerStyle
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};

// Add a styled component for the map container
const MapWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '500px',
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  '& .leaflet-container': {
    width: '100% !important',
    height: '100% !important',
    position: 'absolute !important',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  '& .leaflet-control-container': {
    zIndex: 2
  },
  '& .leaflet-pane': {
    zIndex: 1
  },
  '& .leaflet-top, & .leaflet-bottom': {
    zIndex: 2
  }
}));

// Add a styled component for the map section
const MapSection = styled(Box)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(3),
  '& .map-controls': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2)
  }
}));

export default function PetrolPumps() {
  const [pumps, setPumps] = useState([]);
  const [filteredPumps, setFilteredPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pumpToDelete, setPumpToDelete] = useState(null);
  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);
  const [pumpToToggleVerify, setPumpToToggleVerify] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedPump, setSelectedPump] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState(null);
  const [importError, setImportError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newPump, setNewPump] = useState({
    customerName: '',
    dealerName: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      district: '',
      state: '',
      pincode: ''
    },
    location: {
      latitude: '',
      longitude: ''
    },
    contactDetails: {
      phone: '',
      email: ''
    },
    company: '',
    status: 'active',
    createdAt: new Date()
  });
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [manualLocation, setManualLocation] = useState({
    latitude: '',
    longitude: ''
  });

  const defaultCenter = {
    lat: 20.5937, // Default to India's center
    lng: 78.9629
  };

  // Menu handlers
  const handleOpenMenu = (event, pump) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(pump);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch pumps data
  useEffect(() => {
    const fetchPumps = async () => {
      try {
        console.log('Fetching petrol pumps...');
        const pumpsRef = collection(db, 'petrolPumps');
        const q = query(pumpsRef);
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found ${querySnapshot.size} pumps in petrolPumps`);
          const pumpsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPumps(pumpsData);
          setFilteredPumps(pumpsData);
          setLoading(false);
        } else {
          setError('No petrol pump data found.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching petrol pumps:', error);
        setError(`Error fetching data: ${error.message}`);
        setLoading(false);
      }
    };

    fetchPumps();
  }, []);

  // Filter pumps based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPumps(pumps);
    } else {
      const filtered = pumps.filter(pump => 
        (pump.customerName && pump.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pump.dealerName && pump.dealerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pump.addressLine1 && pump.addressLine1.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pump.addressLine2 && pump.addressLine2.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pump.addressLine3 && pump.addressLine3.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pump.addressLine4 && pump.addressLine4.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPumps(filtered);
    }
  }, [searchTerm, pumps]);

  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Delete pump handlers
  const handleOpenDeleteDialog = (pump) => {
    setPumpToDelete(pump);
    setOpenDeleteDialog(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setPumpToDelete(null);
  };

  const handleDeletePump = async () => {
    if (!pumpToDelete) return;
    
    setActionLoading(true);
    try {
      const pumpRef = doc(db, 'petrolPumps', pumpToDelete.id);
      await deleteDoc(pumpRef);
      
      // Remove from state
      setPumps(prevPumps => prevPumps.filter(pump => pump.id !== pumpToDelete.id));
      setFilteredPumps(prevPumps => prevPumps.filter(pump => pump.id !== pumpToDelete.id));
      
      setActionLoading(false);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting petrol pump:', error);
      setActionLoading(false);
    }
  };

  // Verify/Unverify pump handlers
  const handleOpenVerifyDialog = (pump) => {
    setPumpToToggleVerify(pump);
    setOpenVerifyDialog(true);
    handleCloseMenu();
  };

  const handleCloseVerifyDialog = () => {
    setOpenVerifyDialog(false);
    setPumpToToggleVerify(null);
  };

  const handleToggleVerifyPump = async () => {
    if (!pumpToToggleVerify) return;
    
    setActionLoading(true);
    try {
      const pumpRef = doc(db, 'petrolPumps', pumpToToggleVerify.id);
      const newVerificationStatus = !pumpToToggleVerify.isVerified;
      
      await updateDoc(pumpRef, {
        isVerified: newVerificationStatus
      });
      
      // Update state
      setPumps(prevPumps => prevPumps.map(pump => 
        pump.id === pumpToToggleVerify.id 
          ? { ...pump, isVerified: newVerificationStatus } 
          : pump
      ));
      
      setFilteredPumps(prevPumps => prevPumps.map(pump => 
        pump.id === pumpToToggleVerify.id 
          ? { ...pump, isVerified: newVerificationStatus } 
          : pump
      ));
      
      setActionLoading(false);
      handleCloseVerifyDialog();
    } catch (error) {
      console.error('Error updating pump verification status:', error);
      setActionLoading(false);
    }
  };

  // View details handlers
  const handleOpenDetailsDialog = (pump) => {
    setSelectedPump(pump);
    setOpenDetailsDialog(true);
    handleCloseMenu();
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedPump(null);
  };

  // Toggle view mode
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle Excel file import
  const handleFileUpload = (event) => {
    setImportFile(event.target.files[0]);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportProgress(0);
    setImportStatus(null);
    setImportError(null);
  };

  const processExcelData = async (data) => {
    try {
      const totalRows = data.length;
      let processedRows = 0;
      let importedCount = 0;
      
      for (const row of data) {
        try {
          const newPump = {
            customerName: row.CustomerName || '',
            dealerName: row.DealerName || '',
            address: {
              line1: row.AddressLine1 || '',
              line2: row.AddressLine2 || '',
              city: row.City || '',
              district: row.District || '',
              state: row.State || '',
              pincode: row.Pincode || ''
            },
            location: {
              latitude: row.Latitude || '',
              longitude: row.Longitude || ''
            },
            contactDetails: {
              phone: row.Phone || '',
              email: row.Email || ''
            },
            company: row.Company || '',
            status: 'active',
            isVerified: false,
            createdAt: new Date()
          };
          
          const pumpRef = collection(db, 'petrolPumps');
          await addDoc(pumpRef, newPump);
          importedCount++;
        } catch (error) {
          console.error('Error importing row:', error);
        }
        
        processedRows++;
        setImportProgress(Math.round((processedRows / totalRows) * 100));
      }
      
      setImportStatus(`Successfully imported ${importedCount} out of ${totalRows} petrol pumps.`);
      
      // Fetch updated pumps
      const pumpsRef = collection(db, 'petrolPumps');
      const q = query(pumpsRef);
      const querySnapshot = await getDocs(q);
      const pumpsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPumps(pumpsData);
      setFilteredPumps(pumpsData);
    } catch (error) {
      console.error('Error processing Excel data:', error);
      setImportError('Failed to process Excel data. Please check format and try again.');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Please select a file to import.');
      return;
    }
    
    setImportProgress(0);
    setImportStatus(null);
    setImportError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          if (data.length === 0) {
            setImportError('No data found in the spreadsheet.');
            return;
          }
          
          processExcelData(data);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          setImportError('Failed to parse Excel file. Please check format and try again.');
        }
      };
      
      reader.readAsBinaryString(importFile);
    } catch (error) {
      console.error('Error reading file:', error);
      setImportError('Failed to read file. Please try again.');
    }
  };

  // Create pump handlers
  const handleOpenCreateDialog = () => {
    setNewPump({
      customerName: '',
      dealerName: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        district: '',
        state: '',
        pincode: ''
      },
      location: {
        latitude: '',
        longitude: ''
      },
      contactDetails: {
        phone: '',
        email: ''
      },
      company: '',
      status: 'active',
      createdAt: new Date()
    });
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleCreateChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewPump(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewPump(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCreatePump = async () => {
    setActionLoading(true);
    try {
      const pumpsRef = collection(db, 'petrolPumps');
      
      const docRef = await addDoc(pumpsRef, {
        ...newPump
      });
      
      // Add to state
      const createdPump = {
        id: docRef.id,
        ...newPump
      };
      
      setPumps(prevPumps => [createdPump, ...prevPumps]);
      setFilteredPumps(prevPumps => [createdPump, ...prevPumps]);
      
      setActionLoading(false);
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error creating pump:', error);
      setActionLoading(false);
    }
  };

  // Map click handler component
  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        setSelectedLocation(e.latlng);
        handleCreateChange('location', {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      },
    });

    return selectedLocation ? (
      <Marker
        position={selectedLocation}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const newPosition = e.target.getLatLng();
            setSelectedLocation(newPosition);
            handleCreateChange('location', {
              lat: newPosition.lat,
              lng: newPosition.lng
            });
          },
        }}
      />
    ) : null;
  }

  // Render address function
  const renderAddress = (pump) => {
    let address = '';
    
    if (pump.addressLine1) address += pump.addressLine1;
    if (pump.addressLine2) address += address ? `, ${pump.addressLine2}` : pump.addressLine2;
    if (pump.addressLine3) address += address ? `, ${pump.addressLine3}` : pump.addressLine3;
    if (pump.addressLine4) address += address ? `, ${pump.addressLine4}` : pump.addressLine4;
    
    if (!address && pump.address) {
      if (pump.address.line1) address += pump.address.line1;
      if (pump.address.line2) address += address ? `, ${pump.address.line2}` : pump.address.line2;
      if (pump.address.city) address += address ? `, ${pump.address.city}` : pump.address.city;
      if (pump.address.district) address += address ? `, ${pump.address.district}` : pump.address.district;
      if (pump.address.state) address += address ? `, ${pump.address.state}` : pump.address.state;
      if (pump.address.pincode) address += address ? ` - ${pump.address.pincode}` : pump.address.pincode;
    }
    
    return address || 'No address available';
  };

  // Get petrol pump status
  const getPumpStatus = (pump) => {
    return pump.isVerified ? 'verified' : 'unverified';
  };

  const handleManualLocationChange = (field, value) => {
    const newValue = value === '' ? '' : parseFloat(value);
    setManualLocation(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    if (field === 'latitude' && manualLocation.longitude !== '') {
      handleCreateChange('location', {
        lat: newValue,
        lng: manualLocation.longitude
      });
      setSelectedLocation({ lat: newValue, lng: manualLocation.longitude });
    } else if (field === 'longitude' && manualLocation.latitude !== '') {
      handleCreateChange('location', {
        lat: manualLocation.latitude,
        lng: newValue
      });
      setSelectedLocation({ lat: manualLocation.latitude, lng: newValue });
    }
  };

  const handleRemoveLocation = () => {
    setSelectedLocation(null);
    setManualLocation({ latitude: '', longitude: '' });
    handleCreateChange('location', null);
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
          Petrol Pump Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            onClick={() => setImportDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Import
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreateDialog}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
            }}
          >
            Add New Pump
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <SearchField
              placeholder="Search pumps..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                sx={{ '.MuiTab-root': { fontWeight: 500, minWidth: 100 } }}
              >
                <Tab label="All Pumps" />
                <Tab label="Verified" />
                <Tab label="Unverified" />
              </Tabs>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
              >
                <ToggleButton value="table" aria-label="table view">
                  <ListViewIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                  <GridViewIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="petrol pumps table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Pump Details</StyledTableCell>
                  <StyledTableCell>Address</StyledTableCell>
                  <StyledTableCell>Contact</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPumps
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((pump) => (
                    <StyledTableRow key={pump.id}>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <PumpIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {pump.customerName || 'Unnamed Pump'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {pump.dealerName || 'No dealer info'}
                            </Typography>
                          </Box>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <LocationIcon fontSize="small" sx={{ mt: 0.5, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {renderAddress(pump)}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        {pump.contactDetails?.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {pump.contactDetails.phone}
                            </Typography>
                          </Box>
                        )}
                        {pump.contactDetails?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {pump.contactDetails.email}
                            </Typography>
                          </Box>
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        <StatusChip 
                          label={pump.isVerified ? 'Verified' : 'Unverified'} 
                          status={getPumpStatus(pump)}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <IconButton
                          aria-label="more"
                          aria-controls="row-menu"
                          aria-haspopup="true"
                          onClick={(event) => handleOpenMenu(event, pump)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                {filteredPumps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No petrol pumps found
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
            count={filteredPumps.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {filteredPumps
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((pump) => (
                <Grid item xs={12} sm={6} md={4} key={pump.id}>
                  <PumpCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <PumpIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {pump.customerName || 'Unnamed Pump'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {pump.dealerName || 'No dealer info'}
                            </Typography>
                          </Box>
                        </Box>
                        <StatusChip 
                          label={pump.isVerified ? 'Verified' : 'Unverified'} 
                          status={getPumpStatus(pump)}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <LocationIcon sx={{ mt: 0.5, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {renderAddress(pump)}
                        </Typography>
                      </Box>
                      
                      {pump.contactDetails?.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {pump.contactDetails.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      {pump.contactDetails?.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {pump.contactDetails.email}
                          </Typography>
                        </Box>
                      )}
                      
                      {pump.company && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {pump.company}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        startIcon={<ViewIcon />}
                        onClick={() => handleOpenDetailsDialog(pump)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDetailsDialog(pump)}
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </PumpCard>
                </Grid>
              ))}
          </Grid>
          
          {filteredPumps.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No petrol pumps found
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              rowsPerPageOptions={[6, 12, 24]}
              component="div"
              count={filteredPumps.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Box>
      )}
      
      {/* Row Actions Menu */}
      <Menu
        id="row-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        elevation={3}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={() => handleOpenDetailsDialog(selectedRow)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={() => handleOpenVerifyDialog(selectedRow)}>
          <ListItemIcon>
            {selectedRow?.isVerified ? <CancelIcon fontSize="small" color="warning" /> : <VerifiedIcon fontSize="small" color="success" />}
          </ListItemIcon>
          <ListItemText primary={selectedRow?.isVerified ? "Mark as Unverified" : "Mark as Verified"} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenDeleteDialog(selectedRow)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Import Petrol Pumps
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Upload an Excel file (.xlsx) with petrol pump data. The file should contain the following columns:
            CustomerName, DealerName, AddressLine1, AddressLine2, City, District, State, Pincode, Latitude, Longitude, Phone, Email, Company.
          </Typography>
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ py: 1.5, borderRadius: 2, borderStyle: 'dashed' }}
            >
              Select Excel File
              <input
                type="file"
                accept=".xlsx, .xls"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            {importFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {importFile.name}
              </Typography>
            )}
          </Box>
          
          {importProgress > 0 && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Importing: {importProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={importProgress} />
            </Box>
          )}
          
          {importStatus && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {importStatus}
            </Alert>
          )}
          
          {importError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {importError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseImportDialog}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            variant="contained"
            disabled={!importFile || importProgress > 0}
            startIcon={importProgress > 0 ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{ borderRadius: 2 }}
          >
            Import Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this petrol pump? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePump}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify/Unverify Confirmation Dialog */}
      <Dialog open={openVerifyDialog} onClose={handleCloseVerifyDialog}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {pumpToToggleVerify?.isVerified ? 'Mark as Unverified' : 'Mark as Verified'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to {pumpToToggleVerify?.isVerified ? 'unverify' : 'verify'} this petrol pump?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseVerifyDialog}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleToggleVerifyPump}
            variant="contained"
            color={pumpToToggleVerify?.isVerified ? "warning" : "success"}
            disabled={actionLoading}
            startIcon={actionLoading ? 
              <CircularProgress size={20} /> : 
              pumpToToggleVerify?.isVerified ? <CancelIcon /> : <VerifiedIcon />
            }
            sx={{ borderRadius: 2 }}
          >
            {pumpToToggleVerify?.isVerified ? 'Unverify' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View/Edit Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Petrol Pump Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPump && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={selectedPump.customerName || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dealer Name"
                  value={selectedPump.dealerName || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Address
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={selectedPump.addressLine1 || selectedPump.address?.line1 || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  value={selectedPump.addressLine2 || selectedPump.address?.line2 || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={selectedPump.addressLine3 || selectedPump.address?.city || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="District"
                  value={selectedPump.district || selectedPump.address?.district || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={selectedPump.pincode || selectedPump.address?.pincode || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <MapSection>
                  <Box className="map-controls">
                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MyLocationIcon color="primary" />
                      Location Coordinates
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MapIcon />}
                      onClick={() => setShowMap(!showMap)}
                    >
                      {showMap ? 'Hide Map' : 'Show Map'}
                    </Button>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Latitude"
                        type="number"
                        value={manualLocation.latitude}
                        onChange={(e) => handleManualLocationChange('latitude', e.target.value)}
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Longitude"
                        type="number"
                        value={manualLocation.longitude}
                        onChange={(e) => handleManualLocationChange('longitude', e.target.value)}
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

                  {showMap && (
                    <MapWrapper>
                      <MapContainer
                        center={selectedLocation || defaultCenter}
                        zoom={5}
                        style={mapContainerStyle}
                        scrollWheelZoom={true}
                        zoomControl={true}
                        attributionControl={true}
                        doubleClickZoom={true}
                        dragging={true}
                        touchZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                      </MapContainer>
                    </MapWrapper>
                  )}

                  {selectedLocation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Selected Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<ClearIcon />}
                        onClick={handleRemoveLocation}
                        sx={{ ml: 'auto' }}
                      >
                        Remove Location
                      </Button>
                    </Box>
                  )}
                </MapSection>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Contact Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedPump.contactDetails?.phone || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedPump.contactDetails?.email || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={selectedPump.company || ''}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedPump.isVerified ? 'Verified' : 'Unverified'}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseDetailsDialog}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Petrol Pump Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Create New Petrol Pump
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newPump.customerName}
                onChange={(e) => handleCreateChange('customerName', e.target.value)}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dealer Name"
                value={newPump.dealerName}
                onChange={(e) => handleCreateChange('dealerName', e.target.value)}
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
            
            {/* Address Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                Address Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={newPump.address.line1}
                onChange={(e) => handleCreateChange('address.line1', e.target.value)}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={newPump.address.line2}
                onChange={(e) => handleCreateChange('address.line2', e.target.value)}
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
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={newPump.address.city}
                onChange={(e) => handleCreateChange('address.city', e.target.value)}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="District"
                value={newPump.address.district}
                onChange={(e) => handleCreateChange('address.district', e.target.value)}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={newPump.address.state}
                onChange={(e) => handleCreateChange('address.state', e.target.value)}
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pincode"
                value={newPump.address.pincode}
                onChange={(e) => handleCreateChange('address.pincode', e.target.value)}
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
            
            {/* Location */}
            <Grid item xs={12}>
              <MapSection>
                <Box className="map-controls">
                  <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MyLocationIcon color="primary" />
                    Location Coordinates
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MapIcon />}
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </Button>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={manualLocation.latitude}
                      onChange={(e) => handleManualLocationChange('latitude', e.target.value)}
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={manualLocation.longitude}
                      onChange={(e) => handleManualLocationChange('longitude', e.target.value)}
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

                {showMap && (
                  <MapWrapper>
                    <MapContainer
                      center={selectedLocation || defaultCenter}
                      zoom={5}
                      style={mapContainerStyle}
                      scrollWheelZoom={true}
                      zoomControl={true}
                      attributionControl={true}
                      doubleClickZoom={true}
                      dragging={true}
                      touchZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker />
                    </MapContainer>
                  </MapWrapper>
                )}

                {selectedLocation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Selected Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<ClearIcon />}
                      onClick={handleRemoveLocation}
                      sx={{ ml: 'auto' }}
                    >
                      Remove Location
                    </Button>
                  </Box>
                )}
              </MapSection>
            </Grid>
            
            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="primary" />
                Contact Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newPump.contactDetails.phone}
                onChange={(e) => handleCreateChange('contactDetails.phone', e.target.value)}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newPump.contactDetails.email}
                onChange={(e) => handleCreateChange('contactDetails.email', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Company Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={newPump.company}
                onChange={(e) => handleCreateChange('company', e.target.value)}
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
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseCreateDialog} 
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePump} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Create Petrol Pump
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleOpenCreateDialog}
        sx={{ 
          position: 'fixed', 
          bottom: 32, 
          right: 32,
          boxShadow: '0 8px 16px rgba(58, 134, 255, 0.3)'
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
} 