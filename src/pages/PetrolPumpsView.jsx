import React, { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Grid,
  Avatar,
  Divider,
  InputAdornment,
  TextField,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover
} from '@mui/material';
import { 
  Visibility as ViewIcon, 
  Help as HelpIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Place as PlaceIcon,
  LocalGasStation as PumpIcon,
  Person as PersonIcon,
  MyLocation as MyLocationIcon,
  Badge as BadgeIcon,
  CheckCircle as VerifiedIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';

// Styled components matching PetrolPumps.jsx
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

export default function PetrolPumpsView() {
  const [pumps, setPumps] = useState([]);
  const [filteredPumps, setFilteredPumps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPump, setSelectedPump] = useState(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [clearLocationLoading, setClearLocationLoading] = useState(false);

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
        (typeof pump.customerName === 'string' && pump.customerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.dealerName === 'string' && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.addressLine1 === 'string' && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (typeof pump.district === 'string' && pump.district.toLowerCase().includes(searchLower)) ||
        (typeof pump.zone === 'string' && pump.zone.toLowerCase().includes(searchLower)) ||
        (typeof pump.salesArea === 'string' && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (typeof pump.company === 'string' && pump.company.toLowerCase().includes(searchLower)) ||
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
        (typeof pump.customerName === 'string' && pump.customerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.dealerName === 'string' && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.addressLine1 === 'string' && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (typeof pump.district === 'string' && pump.district.toLowerCase().includes(searchLower)) ||
        (typeof pump.zone === 'string' && pump.zone.toLowerCase().includes(searchLower)) ||
        (typeof pump.salesArea === 'string' && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (typeof pump.company === 'string' && pump.company.toLowerCase().includes(searchLower)) ||
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
        (typeof pump.customerName === 'string' && pump.customerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.dealerName === 'string' && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.addressLine1 === 'string' && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (typeof pump.district === 'string' && pump.district.toLowerCase().includes(searchLower)) ||
        (typeof pump.zone === 'string' && pump.zone.toLowerCase().includes(searchLower)) ||
        (typeof pump.salesArea === 'string' && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (typeof pump.company === 'string' && pump.company.toLowerCase().includes(searchLower)) ||
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
        (typeof pump.customerName === 'string' && pump.customerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.dealerName === 'string' && pump.dealerName.toLowerCase().includes(searchLower)) ||
        (typeof pump.addressLine1 === 'string' && pump.addressLine1.toLowerCase().includes(searchLower)) ||
        (typeof pump.district === 'string' && pump.district.toLowerCase().includes(searchLower)) ||
        (typeof pump.zone === 'string' && pump.zone.toLowerCase().includes(searchLower)) ||
        (typeof pump.salesArea === 'string' && pump.salesArea.toLowerCase().includes(searchLower)) ||
        (pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (typeof pump.company === 'string' && pump.company.toLowerCase().includes(searchLower)) ||
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

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Fetch petrol pumps with comprehensive data processing
  useEffect(() => {
    const fetchPumps = async () => {
      try {
        setLoading(true);
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
              latitude: data.latitude || data.Latitude || '',
              longitude: data.longitude || data.Longitude || '',
              location: locationData,
              contactDetails: contactDetails,
              isVerified: data.isVerified || data.verified || false,
              active: data.active !== undefined ? data.active : true,
              importedAt: data.importedAt || null
            };
          });
          
          setPumps(pumpsData);
          setError(null);
        } else {
          setError('No petrol pump data found.');
        }
      } catch (err) {
        console.error('Error fetching petrol pumps:', err);
        setError('Failed to fetch petrol pumps. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPumps();
  }, []);

  const handleViewClick = (pump) => {
    setSelectedPump(pump);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedPump(null);
  };

  const handleClearLocation = async () => {
    try {
      setClearLocationLoading(true);
      
      // Get all petrol pump documents
      const pumpsRef = collection(db, 'petrolPumps');
      const querySnapshot = await getDocs(pumpsRef);
      
      if (querySnapshot.empty) {
        setError('No petrol pumps found to clear.');
        return;
      }
      
      // Update all documents
      const updatePromises = querySnapshot.docs.map(docSnapshot => {
        const pumpRef = doc(db, 'petrolPumps', docSnapshot.id);
        return updateDoc(pumpRef, {
          location: ""
        });
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // console.log("Location field cleared for all pumps");
      
      // Update the local state for all pumps
      setPumps(prevPumps => 
        prevPumps.map(pump => ({
          ...pump,
          location: ""
        }))
      );
      
      // Clear selected pump if any
      if (selectedPump) {
        setSelectedPump(prev => ({
          ...prev,
          location: ""
        }));
      }
      
      // Show success message
      setError(null);
      setSuccess('Location field cleared successfully for all petrol pumps!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (error) {
      console.error('Error clearing location field for all pumps:', error);
      setError('Failed to clear location field for all pumps. Please try again.');
    } finally {
      setClearLocationLoading(false);
    }
  };

  const getStatusChip = (pump) => {
    const status = pump.isVerified || pump.verified ? 'verified' : 'unverified';
    return (
      <StatusChip 
        label={pump.isVerified || pump.verified ? "Verified" : "Unverified"} 
        status={status}
        size="small" 
      />
    );
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
          View Petrol Pumps
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* <Button
            onClick={handleClearLocation}
            variant="outlined"
            color="warning"
            startIcon={clearLocationLoading ? <CircularProgress size={16} /> : <ClearIcon />}
            disabled={clearLocationLoading}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {clearLocationLoading ? 'Clearing Location...' : 'Clear Location Field (All Pumps)'}
          </Button> */}
          
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => setHelpDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Help
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search Bar */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  size="small"
                >
                  Filter
                </Button>
                
                {/* <Typography variant="body2" color="text.secondary">
                  {filteredPumps.length} of {pumps.length} pumps
                </Typography> */}
              </Box>
            </Box>
            
            
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

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Petrol Pumps ({filteredPumps.length} of {pumps.length} total)
          </Typography>
        </CardContent>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="petrol pumps table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Pump Details</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>District</StyledTableCell>
                <StyledTableCell>Sales Area</StyledTableCell>
                <StyledTableCell>Contact</StyledTableCell>
                {/* <StyledTableCell>Status</StyledTableCell> */}
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
                    {/* <StyledTableCell>
                      {getStatusChip(pump)}
                    </StyledTableCell> */}
                    <StyledTableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewClick(pump)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {filteredPumps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
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

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
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
            <PumpIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Petrol Pump Details: {selectedPump?.customerName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPump && (
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

                <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                  <TextField
                    fullWidth
                    label="Petrol Pump Name"
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
                

                    <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
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
                <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
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

                    <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
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

                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
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

                    <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
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
                <Grid item xs={12} sm={6} sx={{ width: '600px' }}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={selectedPump.addressLine1 || ''}
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
                <Grid item xs={12} sm={6} sx={{ width: '600px' }}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={selectedPump.addressLine2 || ''}
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
                
                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 3"
                    value={selectedPump.addressLine3 || ''}
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
                </Grid> */}
                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 4"
                    value={selectedPump.addressLine4 || ''}
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
                </Grid> */}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="District"
                    value={selectedPump.district || ''}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={selectedPump.pincode || ''}
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
                    value={selectedPump.latitude || selectedPump.Lat || ''}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={selectedPump.longitude || selectedPump.Long || ''}
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
              </Grid>
              
              {/* Status Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                  <VerifiedIcon />
                  Status Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseViewDialog} 
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
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
            <HelpIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Help - View Petrol Pumps
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Use this page to view all petrol pump entries in the system in a read-only format.
          </Typography>
          
          <Typography variant="h6" gutterBottom>Features:</Typography>
          <ul>
            <li><strong>Table View:</strong> See all petrol pumps in a organized table format</li>
            <li><strong>Quick Details:</strong> View basic information like name, company, address, and status</li>
            <li><strong>Detailed View:</strong> Click the view icon to see complete information about a petrol pump</li>
            <li><strong>Status Indicators:</strong> See verification status with color-coded chips</li>
            <li><strong>Pagination:</strong> Navigate through large datasets efficiently</li>
          </ul>
          
          <Typography variant="h6" gutterBottom>Information Displayed:</Typography>
          <ul>
            <li><strong>Basic Info:</strong> Customer name, dealer name, company, SAP code</li>
            <li><strong>Company Info:</strong> Zone, sales area, CO/CL/DO, regional office</li>
            <li><strong>Address:</strong> All address lines, district, pincode</li>
            <li><strong>Contact:</strong> Contact details</li>
            <li><strong>Location:</strong> Latitude and longitude coordinates</li>
            <li><strong>Status:</strong> Verification status, active status</li>
          </ul>
          
          <Typography variant="h6" gutterBottom>Actions:</Typography>
          <ul>
            <li>Click the view icon to see detailed information about a specific petrol pump</li>
            <li>Use the table to quickly scan through all petrol pumps</li>
            <li>Check the status column to see which pumps are verified</li>
            <li>Use pagination to navigate through large datasets</li>
          </ul>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setHelpDialogOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}