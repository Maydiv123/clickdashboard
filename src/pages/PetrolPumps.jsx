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
  ToggleButtonGroup,
  Popover
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
  MyLocation as MyLocationIcon,
  Badge as BadgeIcon,
  Check as CheckIcon
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

// Add a styled component for the contact cell
const ContactCell = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& .MuiTypography-root': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px'
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
    company: 'HPCL',
    zone: '',
    salesArea: '',
    coClDo: '',
    regionalOffice: '',
    district: '',
    sapCode: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    pincode: '',
    contactDetails: '',
    location: {
      latitude: '',
      longitude: ''
    },
    active: true,
    isVerified: false,
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
  const [companyFilter, setCompanyFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

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
    
    // Apply filters based on tab value
    let filtered = [...pumps];
    
    // Apply company filter if set
    if (companyFilter !== 'all') {
      filtered = filtered.filter(pump => pump.company === companyFilter);
    }
    
    // Apply district filter if set
    if (districtFilter !== 'all') {
      filtered = filtered.filter(pump => pump.district === districtFilter);
    }
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pump => 
        (pump.customerName && pump.customerName.toLowerCase().includes(searchLower)) ||
        (pump.dealerName && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (pump.addressLine1 && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (pump.district && pump.district.toLowerCase().includes(searchLower)) ||
        (pump.zone && pump.zone.toLowerCase().includes(searchLower)) ||
        (pump.salesArea && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
      );
    }
    
    // Apply tab-specific filters
    if (newValue === 1) {
      // HPCL pumps
      filtered = filtered.filter(pump => pump.company === 'HPCL');
    } else if (newValue === 2) {
      // BPCL pumps
      filtered = filtered.filter(pump => pump.company === 'BPCL');
    } else if (newValue === 3) {
      // IOCL pumps
      filtered = filtered.filter(pump => pump.company === 'IOCL');
    }
    
    setFilteredPumps(filtered);
  };

  // Handle company filter change
  const handleCompanyFilterChange = (event) => {
    const company = event.target.value;
    setCompanyFilter(company);
    
    let filtered = [...pumps];
    
    // Apply company filter
    if (company !== 'all') {
      filtered = filtered.filter(pump => pump.company === company);
    }
    
    // Apply district filter if set
    if (districtFilter !== 'all') {
      filtered = filtered.filter(pump => pump.district === districtFilter);
    }
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pump => 
        (pump.customerName && pump.customerName.toLowerCase().includes(searchLower)) ||
        (pump.dealerName && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (pump.addressLine1 && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (pump.district && pump.district.toLowerCase().includes(searchLower)) ||
        (pump.zone && pump.zone.toLowerCase().includes(searchLower)) ||
        (pump.salesArea && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
      );
    }
    
    // Apply tab-specific filters
    if (tabValue === 1) {
      // HPCL pumps
      filtered = filtered.filter(pump => pump.company === 'HPCL');
    } else if (tabValue === 2) {
      // BPCL pumps
      filtered = filtered.filter(pump => pump.company === 'BPCL');
    } else if (tabValue === 3) {
      // IOCL pumps
      filtered = filtered.filter(pump => pump.company === 'IOCL');
    }
    
    setFilteredPumps(filtered);
  };
  
  // Handle district filter change
  const handleDistrictFilterChange = (event) => {
    const district = event.target.value;
    setDistrictFilter(district);
    
    let filtered = [...pumps];
    
    // Apply company filter if set
    if (companyFilter !== 'all') {
      filtered = filtered.filter(pump => pump.company === companyFilter);
    }
    
    // Apply district filter
    if (district !== 'all') {
      filtered = filtered.filter(pump => pump.district === district);
    }
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pump => 
        (pump.customerName && pump.customerName.toLowerCase().includes(searchLower)) ||
        (pump.dealerName && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (pump.addressLine1 && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (pump.district && pump.district.toLowerCase().includes(searchLower)) ||
        (pump.zone && pump.zone.toLowerCase().includes(searchLower)) ||
        (pump.salesArea && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
      );
    }
    
    // Apply tab-specific filters
    if (tabValue === 1) {
      // HPCL pumps
      filtered = filtered.filter(pump => pump.company === 'HPCL');
    } else if (tabValue === 2) {
      // BPCL pumps
      filtered = filtered.filter(pump => pump.company === 'BPCL');
    } else if (tabValue === 3) {
      // IOCL pumps
      filtered = filtered.filter(pump => pump.company === 'IOCL');
    }
    
    setFilteredPumps(filtered);
  };

  // Get unique districts for filter
  const getUniqueDistricts = () => {
    const districts = pumps
      .map(pump => pump.district)
      .filter(district => district && district.trim() !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    return districts;
  };

  // Get unique companies for filter
  const getUniqueCompanies = () => {
    const companies = pumps
      .map(pump => pump.company)
      .filter(company => company && company.trim() !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    return companies;
  };

  // Fetch pumps data
  useEffect(() => {
    const fetchPumps = async () => {
      try {
        const pumpsRef = collection(db, 'petrolPumps');
        const q = query(pumpsRef);
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const pumpsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Map location data to standardized format
            let locationData = {};
            if (data.location && (data.location.latitude || data.location.longitude)) {
              locationData = {
                latitude: data.location.latitude,
                longitude: data.location.longitude
              };
            } else if (data.Lat || data.Long) {
              locationData = {
                latitude: data.Lat || data.latitude,
                longitude: data.Long || data.longitude
              };
            }
            
            // Standardize contact details - ensure it's always a string
            let contactDetails = '';
            if (typeof data.contactDetails === 'object' && data.contactDetails !== null) {
              contactDetails = data.contactDetails.phone || '';
            } else if (data.contactDetails !== undefined && data.contactDetails !== null) {
              // Handle both string and number types
              contactDetails = String(data.contactDetails);
            } else if (data['Contact details'] !== undefined && data['Contact details'] !== null) {
              // Check for alternate field name with space
              contactDetails = String(data['Contact details']);
            }
            
            // Return standardized pump object
            return {
              id: doc.id,
              customerName: data.customerName || data['Customer Name'] || '',
              dealerName: data.dealerName || data['Dealer Name'] || '',
              company: data.company || data.Company || '',
              district: data.district || data.District || '',
              zone: data.zone || data.Zone || '',
              salesArea: data.salesArea || data['Sales Area'] || '',
              coClDo: data.coClDo || data['CO/CL/DO'] || '',
              regionalOffice: data.regionalOffice || data['Regional office'] || '',
              sapCode: data.sapCode || data['SAP Code'] || '',
              addressLine1: data.addressLine1 || data['Address Line1'] || '',
              addressLine2: data.addressLine2 || data['Address Line2'] || '',
              addressLine3: data.addressLine3 || data['Address Line3'] || '',
              addressLine4: data.addressLine4 || data['Address Line4'] || '',
              pincode: data.pincode || data.Pincode || '',
              location: locationData,
              contactDetails: contactDetails,
              isVerified: data.isVerified || data.verified || false,
              active: data.active !== undefined ? data.active : true,
              importedAt: data.importedAt || null
            };
          });
          
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

  // Filter pumps based on search term and filters
  useEffect(() => {
    let filtered = [...pumps];
    
    // Apply company filter if set
    if (companyFilter !== 'all') {
      filtered = filtered.filter(pump => pump.company === companyFilter);
    }
    
    // Apply district filter if set
    if (districtFilter !== 'all') {
      filtered = filtered.filter(pump => pump.district === districtFilter);
    }
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pump => 
        (pump.customerName && pump.customerName.toLowerCase().includes(searchLower)) ||
        (pump.dealerName && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (pump.addressLine1 && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (pump.district && pump.district.toLowerCase().includes(searchLower)) ||
        (pump.zone && pump.zone.toLowerCase().includes(searchLower)) ||
        (pump.salesArea && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
      );
    }
    
    // Apply tab-specific filters
    if (tabValue === 1) {
      // HPCL pumps
      filtered = filtered.filter(pump => pump.company === 'HPCL');
    } else if (tabValue === 2) {
      // BPCL pumps
      filtered = filtered.filter(pump => pump.company === 'BPCL');
    } else if (tabValue === 3) {
      // IOCL pumps
      filtered = filtered.filter(pump => pump.company === 'IOCL');
    }
    
    setFilteredPumps(filtered);
  }, [searchTerm, pumps, companyFilter, districtFilter, tabValue]);

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
      company: 'HPCL',
      zone: '',
      salesArea: '',
      coClDo: '',
      regionalOffice: '',
      district: '',
      sapCode: '',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      addressLine4: '',
      pincode: '',
      contactDetails: '',
      location: {
        latitude: '',
        longitude: ''
      },
      active: true,
      isVerified: false,
      createdAt: new Date()
    });
    setSelectedLocation(null);
    setManualLocation({ latitude: '', longitude: '' });
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
      
      // Prepare location data
      let locationData = null;
      if (selectedLocation) {
        locationData = {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        };
      }
      
      // Create new pump document
      const pumpData = {
        customerName: newPump.customerName || '',
        dealerName: newPump.dealerName || '',
        company: newPump.company || 'HPCL',
        zone: newPump.zone || '',
        salesArea: newPump.salesArea || '',
        coClDo: newPump.coClDo || '',
        regionalOffice: newPump.regionalOffice || '',
        district: newPump.district || '',
        sapCode: newPump.sapCode || '',
        addressLine1: newPump.addressLine1 || '',
        addressLine2: newPump.addressLine2 || '',
        addressLine3: newPump.addressLine3 || '',
        addressLine4: newPump.addressLine4 || '',
        pincode: newPump.pincode || '',
        location: locationData,
        contactDetails: newPump.contactDetails || '',
        isVerified: false,
        active: true,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(pumpsRef, pumpData);
      
      // Add to state
      const createdPump = {
        id: docRef.id,
        ...pumpData
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
    
    // If we have district and pincode directly on the pump object
    if (!address) {
      if (pump.district) address += pump.district;
      if (pump.pincode) address += address ? ` - ${pump.pincode}` : pump.pincode;
    }
    
    return address || 'No address available';
  };

  // Get petrol pump status
  const getPumpStatus = (pump) => {
    if (pump.isVerified === true || pump.verified === true) return 'verified';
    if (pump.active === true) return 'active';
    if (pump.active === false) return 'inactive';
    return 'unverified';
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

  // Handle filter click
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Handle filter close
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Clear filters
  const clearFilters = () => {
    setCompanyFilter('all');
    setDistrictFilter('all');
    setFilteredPumps(pumps);
    handleFilterClose();
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
          {/* <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            onClick={() => setImportDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Import
          </Button> */}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  size="small"
                >
                  Filter
                </Button>
                
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
            
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '.MuiTab-root': { 
                  fontWeight: 500, 
                  minWidth: 100,
                  '&.Mui-selected': {
                    fontWeight: 600
                  }
                } 
              }}
            >
              <Tab label={`All Pumps (${pumps.length})`} />
              <Tab label={`HPCL (${pumps.filter(p => p.company === 'HPCL').length})`} />
              <Tab label={`BPCL (${pumps.filter(p => p.company === 'BPCL').length})`} />
              <Tab label={`IOCL (${pumps.filter(p => p.company === 'IOCL').length})`} />
            </Tabs>
          </Box>
        </CardContent>
      </Card>
      
      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 300,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2
          }
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Filter Petrol Pumps
        </Typography>
        
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="company-filter-label">Company</InputLabel>
          <Select
            labelId="company-filter-label"
            id="company-filter"
            value={companyFilter}
            label="Company"
            onChange={(e) => handleCompanyFilterChange(e)}
          >
            <MenuItem value="all">All Companies</MenuItem>
            {getUniqueCompanies().map(company => (
              <MenuItem key={company} value={company}>{company}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="district-filter-label">District</InputLabel>
          <Select
            labelId="district-filter-label"
            id="district-filter"
            value={districtFilter}
            label="District"
            onChange={(e) => handleDistrictFilterChange(e)}
          >
            <MenuItem value="all">All Districts</MenuItem>
            {getUniqueDistricts().map(district => (
              <MenuItem key={district} value={district}>{district}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => {
              setCompanyFilter('all');
              setDistrictFilter('all');
              setFilteredPumps(pumps);
              setFilterAnchorEl(null);
            }}
          >
            Clear Filters
          </Button>
          <Button variant="contained" size="small" onClick={() => setFilterAnchorEl(null)}>
            Apply
          </Button>
        </Box>
      </Popover>

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
                  <StyledTableCell>Company</StyledTableCell>
                  <StyledTableCell>District</StyledTableCell>
                  <StyledTableCell>Sales Area</StyledTableCell>
                  <StyledTableCell>Contact</StyledTableCell>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {pump.company || 'N/A'}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {pump.district || 'N/A'}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {pump.salesArea || 'N/A'}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <ContactCell>
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography variant="body2" title={typeof pump.contactDetails === 'object' 
                              ? pump.contactDetails?.phone || 'N/A' 
                              : (pump.contactDetails || pump.contactDetails === 0) ? String(pump.contactDetails) : 'N/A'}>
                            {typeof pump.contactDetails === 'object' 
                              ? pump.contactDetails?.phone || 'N/A' 
                              : (pump.contactDetails || pump.contactDetails === 0) ? String(pump.contactDetails) : 'N/A'}
                          </Typography>
                        </ContactCell>
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
                    <TableCell colSpan={6}>
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
                        <Chip 
                          label={pump.company || 'N/A'} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BusinessIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="body2">
                          <strong>Company:</strong> {pump.company || 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="body2">
                          <strong>District:</strong> {pump.district || 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BusinessIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="body2">
                          <strong>Sales Area:</strong> {pump.salesArea || 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PhoneIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          <strong>Contact:</strong> {typeof pump.contactDetails === 'object' 
                            ? pump.contactDetails?.phone || 'N/A' 
                            : (pump.contactDetails || pump.contactDetails === 0) ? String(pump.contactDetails) : 'N/A'}
                        </Typography>
                      </Box>
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
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PumpIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Petrol Pump Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPump && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <BusinessIcon />
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={selectedPump.customerName || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dealer Name"
                  value={selectedPump.dealerName || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={selectedPump.company || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SAP Code"
                  value={selectedPump.sapCode || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              {/* Company Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                  <BusinessIcon />
                  Company Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Zone"
                  value={selectedPump.zone || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Sales Area"
                  value={selectedPump.salesArea || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CO/CL/DO"
                  value={selectedPump.coClDo || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Regional Office"
                  value={selectedPump.regionalOffice || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              {/* Address Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                  <LocationIcon />
                  Address Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={selectedPump.addressLine1 || selectedPump.address?.line1 || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  value={selectedPump.addressLine2 || selectedPump.address?.line2 || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="District"
                  value={selectedPump.district || selectedPump.address?.district || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={selectedPump.pincode || selectedPump.address?.pincode || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                  <PhoneIcon />
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Details"
                  value={
                    typeof selectedPump.contactDetails === 'object' 
                      ? selectedPump.contactDetails?.phone || 'N/A' 
                      : (selectedPump.contactDetails || selectedPump.contactDetails === 0) ? String(selectedPump.contactDetails) : 'N/A'
                  }
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              {/* Location Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                  <MyLocationIcon />
                  Location Coordinates
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  value={selectedPump.location?.latitude || selectedPump.Lat || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <MyLocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  value={selectedPump.location?.longitude || selectedPump.Long || ''}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <MyLocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              {/* Status Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                  <VerifiedIcon />
                  Status Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Verification Status"
                  value={selectedPump.isVerified || selectedPump.verified ? 'Verified' : 'Unverified'}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedIcon color={selectedPump.isVerified || selectedPump.verified ? "success" : "action"} />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Active Status"
                  value={selectedPump.active === false ? 'Inactive' : 'Active'}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CheckIcon color={selectedPump.active === false ? "error" : "success"} />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
              
              {/* Map View */}
              {(selectedPump.location?.latitude || selectedPump.Lat) && 
               (selectedPump.location?.longitude || selectedPump.Long) && (
                <Grid item xs={12}>
                  <Box sx={{ height: 400, width: '100%', mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                    <MapContainer
                      center={[
                        selectedPump.location?.latitude || selectedPump.Lat, 
                        selectedPump.location?.longitude || selectedPump.Long
                      ]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker 
                        position={[
                          selectedPump.location?.latitude || selectedPump.Lat, 
                          selectedPump.location?.longitude || selectedPump.Long
                        ]}
                      >
                        <Popup>
                          <strong>{selectedPump.customerName}</strong><br />
                          {renderAddress(selectedPump)}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog} color="primary">
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                value={newPump.company}
                onChange={(e) => handleCreateChange('company', e.target.value)}
                variant="outlined"
                select
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="HPCL">HPCL</MenuItem>
                <MenuItem value="BPCL">BPCL</MenuItem>
                <MenuItem value="IOCL">IOCL</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SAP Code"
                value={newPump.sapCode}
                onChange={(e) => handleCreateChange('sapCode', e.target.value)}
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
            
            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Company Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Zone"
                value={newPump.zone}
                onChange={(e) => handleCreateChange('zone', e.target.value)}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sales Area"
                value={newPump.salesArea}
                onChange={(e) => handleCreateChange('salesArea', e.target.value)}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CO/CL/DO"
                value={newPump.coClDo}
                onChange={(e) => handleCreateChange('coClDo', e.target.value)}
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Regional Office"
                value={newPump.regionalOffice}
                onChange={(e) => handleCreateChange('regionalOffice', e.target.value)}
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
                value={newPump.addressLine1}
                onChange={(e) => handleCreateChange('addressLine1', e.target.value)}
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
                value={newPump.addressLine2}
                onChange={(e) => handleCreateChange('addressLine2', e.target.value)}
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
                label="District"
                value={newPump.district}
                onChange={(e) => handleCreateChange('district', e.target.value)}
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
                value={newPump.pincode}
                onChange={(e) => handleCreateChange('pincode', e.target.value)}
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
                label="Contact Details"
                value={newPump.contactDetails}
                onChange={(e) => handleCreateChange('contactDetails', e.target.value)}
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
      {/* <Fab 
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
      </Fab> */}
    </Box>
  );
} 