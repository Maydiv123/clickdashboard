import React, { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Avatar,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  Popover,
  Autocomplete
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  LocalGasStation as PumpIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  MyLocation as MyLocationIcon,
  Badge as BadgeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';

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

export default function PetrolPumpsEdit() {
  const [pumps, setPumps] = useState([]);
  const [filteredPumps, setFilteredPumps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPump, setSelectedPump] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // CO/CL/DO options
  const coClDoOptions = ['CO', 'CL', 'DO'];

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

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
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

  const handleEditClick = (pump) => {
    setSelectedPump(pump);
    setEditFormData({
      customerName: pump.customerName || '',
      dealerName: pump.dealerName || '',
      company: pump.company || '',
      zone: pump.zone || '',
      salesArea: pump.salesArea || '',
      coClDo: pump.coClDo || '',
      regionalOffice: pump.regionalOffice || '',
      district: pump.district || '',
      sapCode: pump.sapCode || '',
      addressLine1: pump.addressLine1 || '',
      addressLine2: pump.addressLine2 || '',
      addressLine3: pump.addressLine3 || '',
      addressLine4: pump.addressLine4 || '',
      pincode: pump.pincode || '',
      contactDetails: pump.contactDetails || '',
      location: {
        latitude: pump.location?.latitude || '',
        longitude: pump.location?.longitude || ''
      }
    });
    setEditDialogOpen(true);
  };

  const handleEditInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateEditForm = () => {
    const errors = [];
    
    if (!String(editFormData.customerName || '').trim()) errors.push('Customer name is required');
    if (!String(editFormData.company || '').trim()) errors.push('Company is required');
    if (!String(editFormData.district || '').trim()) errors.push('District is required');
    if (!String(editFormData.pincode || '').trim()) errors.push('Pincode is required');
    if (!String(editFormData.contactDetails || '').trim()) errors.push('Contact details are required');
    
    // Validate pincode (6 digits)
    if (editFormData.pincode && !/^\d{6}$/.test(String(editFormData.pincode))) {
      errors.push('Pincode must be 6 digits');
    }
    
    // Validate latitude and longitude if provided
    if (editFormData.location?.latitude && (isNaN(editFormData.location.latitude) || parseFloat(editFormData.location.latitude) < -90 || parseFloat(editFormData.location.latitude) > 90)) {
      errors.push('Latitude must be a valid number between -90 and 90');
    }
    
    if (editFormData.location?.longitude && (isNaN(editFormData.location.longitude) || parseFloat(editFormData.location.longitude) < -180 || parseFloat(editFormData.location.longitude) > 180)) {
      errors.push('Longitude must be a valid number between -180 and 180');
    }
    
    return errors;
  };

  const handleSaveEdit = async () => {
    if (!selectedPump) return;

    const errors = validateEditForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      const pumpRef = doc(db, 'petrolPumps', selectedPump.id);
      await updateDoc(pumpRef, {
        ...editFormData,
        updatedAt: new Date()
      });

      // Update local state
      setPumps(prevPumps => 
        prevPumps.map(pump => 
          pump.id === selectedPump.id 
            ? { ...pump, ...editFormData, updatedAt: new Date() }
            : pump
        )
      );

      setSuccess('Petrol pump updated successfully!');
      setEditDialogOpen(false);
      setSelectedPump(null);
      setEditFormData({});
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating petrol pump:', err);
      setError('Failed to update petrol pump. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setSelectedPump(null);
    setEditFormData({});
    setError(null);
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
          Edit Petrol Pumps
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          onClick={() => setHelpDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Help
        </Button>
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
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  size="small"
                >
                  Filter
                </Button>
                
                <Typography variant="body2" color="text.secondary">
                  {filteredPumps.length} of {pumps.length} pumps
                </Typography>
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

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select a petrol pump to edit ({filteredPumps.length} of {pumps.length} total)
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
                      <Tooltip title="Edit Petrol Pump">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditClick(pump)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
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

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
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
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Edit Petrol Pump: {selectedPump?.customerName}
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
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Customer Name"
                value={editFormData.customerName || ''}
                onChange={(e) => handleEditInputChange('customerName', e.target.value)}
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
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Dealer Name"
                value={editFormData.dealerName || ''}
                onChange={(e) => handleEditInputChange('dealerName', e.target.value)}
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
            
            {/* Spacer to force new line */}
            <Grid item xs={12}></Grid>
            
            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                <BusinessIcon />
                Company Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Zone"
                value={editFormData.zone || ''}
                onChange={(e) => handleEditInputChange('zone', e.target.value)}
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
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="SAP Code"
                value={editFormData.sapCode || ''}
                onChange={(e) => handleEditInputChange('sapCode', e.target.value)}
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
            
            <Grid item xs={12} >
              <FormControl fullWidth required>
                <InputLabel>Company</InputLabel>
                <Select
                  value={editFormData.company || ''}
                  label="Company"
                  onChange={(e) => handleEditInputChange('company', e.target.value)}
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
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Sales Area"
                value={editFormData.salesArea || ''}
                onChange={(e) => handleEditInputChange('salesArea', e.target.value)}
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
            <Grid item xs={12} >
              <FormControl fullWidth>
                <InputLabel>CO/CL/DO</InputLabel>
                <Select
                  value={editFormData.coClDo || ''}
                  onChange={(e) => handleEditInputChange('coClDo', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {coClDoOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Regional Office"
                value={editFormData.regionalOffice || ''}
                onChange={(e) => handleEditInputChange('regionalOffice', e.target.value)}
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
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                <LocationIcon />
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Address Line 1"
                value={editFormData.addressLine1 || ''}
                onChange={(e) => handleEditInputChange('addressLine1', e.target.value)}
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
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Address Line 2"
                value={editFormData.addressLine2 || ''}
                onChange={(e) => handleEditInputChange('addressLine2', e.target.value)}
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
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Address Line 3"
                value={editFormData.addressLine3 || ''}
                onChange={(e) => handleEditInputChange('addressLine3', e.target.value)}
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
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Address Line 4"
                value={editFormData.addressLine4 || ''}
                onChange={(e) => handleEditInputChange('addressLine4', e.target.value)}
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
            
            <Grid item xs={12} >
              <Autocomplete
                freeSolo
                value={editFormData.district || ''}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    handleEditInputChange('district', newValue);
                  } else if (newValue && newValue.inputValue) {
                    handleEditInputChange('district', newValue.inputValue);
                  } else if (newValue) {
                    handleEditInputChange('district', newValue.title);
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  handleEditInputChange('district', newInputValue);
                }}
                options={getUniqueDistricts().map((district) => ({
                  title: district,
                  inputValue: district
                }))}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    return option;
                  }
                  if (option.inputValue) {
                    return option.inputValue;
                  }
                  return option.title;
                }}
                filterOptions={(options, params) => {
                  const filtered = options.filter((option) =>
                    option.title.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  
                  const { inputValue } = params;
                  const isExisting = options.some((option) => inputValue === option.title);
                  if (inputValue !== '' && !isExisting) {
                    filtered.push({
                      inputValue,
                      title: `Add "${inputValue}"`,
                    });
                  }
                  
                  return filtered;
                }}
                renderOption={(props, option) => (
                  <li {...props}>
                    {option.title}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="District"
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Pincode"
                value={editFormData.pincode || ''}
                onChange={(e) => handleEditInputChange('pincode', e.target.value)}
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
            
            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                <PhoneIcon />
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Contact Details"
                value={editFormData.contactDetails || ''}
                onChange={(e) => handleEditInputChange('contactDetails', e.target.value)}
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
            
            {/* Location Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                <MyLocationIcon />
                Location Coordinates
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={editFormData.location?.latitude || ''}
                onChange={(e) => handleEditInputChange('location.latitude', e.target.value)}
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
            <Grid item xs={12} >
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={editFormData.location?.longitude || ''}
                onChange={(e) => handleEditInputChange('location.longitude', e.target.value)}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCancelEdit} 
            variant="outlined"
            color="inherit"
            startIcon={<CancelIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
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
              Help - Edit Petrol Pumps
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Use this page to edit existing petrol pump entries in the system.
          </Typography>
          
          <Typography variant="h6" gutterBottom>How to Edit:</Typography>
          <ul>
            <li>Browse through the table to find the petrol pump you want to edit</li>
            <li>Click the edit icon (pencil) next to the petrol pump</li>
            <li>Modify the information in the edit dialog</li>
            <li>Click "Save Changes" to update the petrol pump</li>
            <li>Click "Cancel" to discard changes</li>
          </ul>
          
          <Typography variant="h6" gutterBottom>Required Fields:</Typography>
          <ul>
            <li><strong>Customer Name:</strong> The name of the petrol pump</li>
            <li><strong>Company:</strong> Select the oil company (HPCL, BPCL, or IOCL)</li>
            <li><strong>District:</strong> The district where the pump is located</li>
            <li><strong>Pincode:</strong> 6-digit postal code</li>
            <li><strong>Contact Details:</strong> Phone number or contact information</li>
          </ul>
          
          <Typography variant="h6" gutterBottom>Validation Rules:</Typography>
          <ul>
            <li>Pincode must be exactly 6 digits</li>
            <li>Latitude must be between -90 and 90</li>
            <li>Longitude must be between -180 and 180</li>
            <li>All required fields must be filled</li>
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