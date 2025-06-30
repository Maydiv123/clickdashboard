import React, { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
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
  TextField,
  InputAdornment,
  Avatar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Warning as WarningIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  LocalGasStation as PumpIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

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

export default function PetrolPumpsDelete() {
  const [pumps, setPumps] = useState([]);
  const [filteredPumps, setFilteredPumps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPump, setSelectedPump] = useState(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

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
        (pump.sapCode && pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
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
        (pump.sapCode && pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
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
        (pump.sapCode && pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
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
        (pump.sapCode && pump.sapCode && pump.sapCode.toString().includes(searchLower)) ||
        (pump.company && pump.company.toLowerCase().includes(searchLower)) ||
        (pump.contactDetails && pump.contactDetails && pump.contactDetails.toString().includes(searchLower))
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

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch petrol pumps
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
          setFilteredPumps(pumpsData);
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

  const handleDeleteClick = (pump) => {
    setSelectedPump(pump);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPump) return;

    try {
      const pumpRef = doc(db, 'petrolPumps', selectedPump.id);
      await deleteDoc(pumpRef);

      // Update local state
      setPumps(prevPumps => 
        prevPumps.filter(pump => pump.id !== selectedPump.id)
      );
      setFilteredPumps(prevPumps => 
        prevPumps.filter(pump => pump.id !== selectedPump.id)
      );

      setSuccess(`Petrol pump "${selectedPump.customerName || 'Unnamed Pump'}" deleted successfully!`);
      setDeleteDialogOpen(false);
      setSelectedPump(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting petrol pump:', err);
      setError('Failed to delete petrol pump. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedPump(null);
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600} color="error">
          Delete Petrol Pumps
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          onClick={() => setHelpDialogOpen(true)}
        >
          Help
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body1">
          <strong>Warning:</strong> Deleting a petrol pump is permanent and cannot be undone. 
          Please make sure you want to delete the selected petrol pump before proceeding.
        </Typography>
      </Alert>

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
            Select a petrol pump to delete ({filteredPumps.length} of {pumps.length} total)
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
                        <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
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
                      <Tooltip title="Delete Petrol Pump">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(pump)}
                        >
                          <DeleteIcon />
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon color="error" />
            <Typography variant="h6" color="error">
              Confirm Deletion
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete the petrol pump:
          </Typography>
          <Typography variant="h6" color="error" gutterBottom>
            "{selectedPump?.customerName || 'Unnamed Pump'}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Company: {selectedPump?.company}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Address: {selectedPump?.address}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Mobile: {selectedPump?.contactDetails || 'N/A'}
          </Typography>
          <Alert severity="error">
            This action cannot be undone. The petrol pump will be permanently removed from the system.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Help - Delete Petrol Pumps</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Use this page to permanently delete petrol pump entries from the system.
          </Typography>
          
          <Typography variant="h6" gutterBottom color="error">
            ⚠️ Important Warning:
          </Typography>
          <Typography variant="body1" paragraph>
            Deleting a petrol pump is a permanent action that cannot be undone. 
            All data associated with the petrol pump will be permanently removed from the system.
          </Typography>
          
          <Typography variant="h6" gutterBottom>How to Delete:</Typography>
          <ol>
            <li>Click the delete icon next to the petrol pump you want to remove</li>
            <li>Review the confirmation dialog carefully</li>
            <li>Click "Delete Permanently" to confirm the deletion</li>
            <li>Click "Cancel" to abort the deletion</li>
          </ol>
          
          <Typography variant="h6" gutterBottom>Before Deleting:</Typography>
          <ul>
            <li>Make sure you have the correct petrol pump selected</li>
            <li>Consider if you need to backup any important data</li>
            <li>Verify that no other users or systems depend on this petrol pump</li>
            <li>Double-check the petrol pump details in the confirmation dialog</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 