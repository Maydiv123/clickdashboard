import { useState, useEffect } from 'react';
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
  LinearProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  CheckCircle as VerifiedIcon,
  Cancel as UnverifiedIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, orderBy, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

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

  // Fetch pumps data
  useEffect(() => {
    const fetchPumps = async () => {
      try {
        console.log('Fetching petrol pumps...');
        const pumpsRef = collection(db, 'map_locations');
        const q = query(pumpsRef);
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found ${querySnapshot.size} pumps in map_locations`);
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
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedPump(null);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'grid' : 'table');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle Excel file import
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      setImportError(null);
    }
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportProgress(0);
    setImportStatus(null);
    setImportError(null);
  };

  const processExcelData = async (data) => {
    try {
      const pumpsRef = collection(db, 'map_locations');
      const totalRows = data.length;
      let processedRows = 0;

      for (const row of data) {
        // Map Excel columns to your data structure
        const pumpData = {
          customerName: row['Customer Name'] || row['CUSTOMER NAME'] || '',
          dealerName: row['Dealer Name'] || row['DEALER NAME'] || '',
          addressLine1: row['Address Line 1'] || row['ADDRESS LINE 1'] || '',
          addressLine2: row['Address Line 2'] || row['ADDRESS LINE 2'] || '',
          addressLine3: row['Address Line 3'] || row['ADDRESS LINE 3'] || '',
          addressLine4: row['Address Line 4'] || row['ADDRESS LINE 4'] || '',
          contactDetails: row['Contact'] || row['CONTACT'] || '',
          latitude: parseFloat(row['Latitude'] || row['LATITUDE']) || null,
          longitude: parseFloat(row['Longitude'] || row['LONGITUDE']) || null,
          zone: row['Zone'] || row['ZONE'] || '',
          salesArea: row['Sales Area'] || row['SALES AREA'] || '',
          sapCode: row['SAP Code'] || row['SAP CODE'] || '',
          coClDo: row['CO/CL/DO'] || row['CO CL DO'] || '',
          pincode: row['Pincode'] || row['PINCODE'] || '',
          district: row['District'] || row['DISTRICT'] || '',
          location: row['Location'] || row['LOCATION'] || '',
          createdAt: new Date()
        };

        // Add to Firestore
        await addDoc(pumpsRef, pumpData);
        
        processedRows++;
        setImportProgress(Math.round((processedRows / totalRows) * 100));
      }

      setImportStatus('success');
      // Refresh the pumps list
      fetchPumps();
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError(error.message);
      setImportStatus('error');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImportProgress(0);
    setImportStatus('processing');
    setImportError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          await processExcelData(jsonData);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setImportError(error.message);
          setImportStatus('error');
        }
      };
      reader.readAsBinaryString(importFile);
    } catch (error) {
      console.error('Error reading file:', error);
      setImportError(error.message);
      setImportStatus('error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Petrol Pump Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import Excel
          </Button>
          <Button
            variant="outlined"
            onClick={toggleViewMode}
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
        </Stack>
      </Box>
      
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search pumps by customer name, dealer name, or address"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {viewMode === 'table' ? (
        /* Table View */
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Dealer Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Zone</TableCell>
                  <TableCell>Sales Area</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPumps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No petrol pumps found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPumps
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((pump) => (
                      <TableRow hover key={pump.id}>
                        <TableCell>{pump.customerName || 'N/A'}</TableCell>
                        <TableCell>{pump.dealerName || 'N/A'}</TableCell>
                        <TableCell>
                          {[
                            pump.addressLine1,
                            pump.addressLine2,
                            pump.addressLine3,
                            pump.addressLine4
                          ].filter(Boolean).join(', ')}
                        </TableCell>
                        <TableCell>{pump.contactDetails || 'N/A'}</TableCell>
                        <TableCell>
                          {pump.latitude && pump.longitude ? (
                            `${pump.latitude.toFixed(6)}, ${pump.longitude.toFixed(6)}`
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={pump.zone || 'N/A'} 
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{pump.salesArea || 'N/A'}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary"
                            onClick={() => handleOpenDetailsDialog(pump)}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton 
                            color={pump.isVerified ? "warning" : "success"}
                            onClick={() => handleOpenVerifyDialog(pump)}
                          >
                            {pump.isVerified ? <UnverifiedIcon /> : <VerifiedIcon />}
                          </IconButton>
                          <IconButton 
                            color="error"
                            onClick={() => handleOpenDeleteDialog(pump)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={filteredPumps.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        /* Grid View */
        <Grid container spacing={3}>
          {filteredPumps
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((pump) => (
              <Grid item xs={12} sm={6} md={4} key={pump.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {pump.customerName || 'Unnamed Pump'}
                      </Typography>
                      {pump.isVerified ? (
                        <Chip 
                          label="Verified" 
                          color="success" 
                          size="small"
                          icon={<VerifiedIcon />}
                        />
                      ) : (
                        <Chip 
                          label="Unverified" 
                          color="warning" 
                          size="small"
                          icon={<UnverifiedIcon />}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {pump.addressLine1 || 'No address provided'}
                      </Typography>
                    </Box>
                    {pump.addedBy && (
                      <Typography variant="body2" color="text.secondary">
                        Added by: {pump.addedBy.name || pump.addedBy.email || 'Unknown user'}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<ViewIcon />}
                      onClick={() => handleOpenDetailsDialog(pump)}
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={pump.isVerified ? <UnverifiedIcon /> : <VerifiedIcon />}
                      color={pump.isVerified ? "warning" : "success"}
                      onClick={() => handleOpenVerifyDialog(pump)}
                    >
                      {pump.isVerified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleOpenDeleteDialog(pump)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          {filteredPumps.length === 0 && (
            <Box sx={{ p: 3, width: '100%', textAlign: 'center' }}>
              <Typography>No petrol pumps found</Typography>
            </Box>
          )}
        </Grid>
      )}
      
      {viewMode === 'grid' && (
        <Box sx={{ mt: 2 }}>
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
      )}
      
      {/* Delete Pump Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the petrol pump{' '}
          {pumpToDelete ? `"${pumpToDelete.customerName || 'Unnamed Pump'}"` : ''}? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePump} 
            color="error" 
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Verify/Unverify Pump Dialog */}
      <Dialog
        open={openVerifyDialog}
        onClose={handleCloseVerifyDialog}
      >
        <DialogTitle>
          {pumpToToggleVerify && pumpToToggleVerify.isVerified 
            ? 'Unverify Petrol Pump' 
            : 'Verify Petrol Pump'}
        </DialogTitle>
        <DialogContent>
          {pumpToToggleVerify && pumpToToggleVerify.isVerified 
            ? `Are you sure you want to mark "${pumpToToggleVerify.customerName || 'this pump'}" as unverified?`
            : `Are you sure you want to verify "${pumpToToggleVerify ? (pumpToToggleVerify.customerName || 'this pump') : ''}"?`}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerifyDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleToggleVerifyPump} 
            color={pumpToToggleVerify && pumpToToggleVerify.isVerified ? "warning" : "success"}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading 
              ? 'Processing...' 
              : (pumpToToggleVerify && pumpToToggleVerify.isVerified ? 'Unverify' : 'Verify')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Pump Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedPump && (
          <>
            <DialogTitle>
              {selectedPump.customerName || 'Unnamed Petrol Pump'}
              {selectedPump.isVerified && (
                <Chip 
                  label="Verified" 
                  color="success" 
                  size="small"
                  icon={<VerifiedIcon />}
                  sx={{ ml: 2 }}
                />
              )}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Address:</Typography>
                  <Typography variant="body2" paragraph>
                    {[
                      selectedPump.addressLine1,
                      selectedPump.addressLine2,
                      selectedPump.addressLine3,
                      selectedPump.addressLine4
                    ].filter(Boolean).join(', ')}
                  </Typography>
                  
                  <Typography variant="subtitle1">Coordinates:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedPump.latitude ? `Lat: ${selectedPump.latitude}, Long: ${selectedPump.longitude}` : 'No coordinates provided'}
                  </Typography>
                  
                  <Typography variant="subtitle1">Added By:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedPump.addedBy?.name || selectedPump.addedBy?.email || 'Unknown user'}
                  </Typography>
                  
                  <Typography variant="subtitle1">Created At:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedPump.createdAt && selectedPump.createdAt.toDate ? 
                      new Date(selectedPump.createdAt.toDate()).toLocaleString() : 
                      'Unknown date'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Fuel Types:</Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedPump.fuelTypes && selectedPump.fuelTypes.length > 0 ? (
                      selectedPump.fuelTypes.map((fuel, index) => (
                        <Chip 
                          key={index}
                          label={fuel}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2">No fuel types specified</Typography>
                    )}
                  </Box>
                  
                  <Typography variant="subtitle1">Amenities:</Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedPump.amenities && selectedPump.amenities.length > 0 ? (
                      selectedPump.amenities.map((amenity, index) => (
                        <Chip 
                          key={index}
                          label={amenity}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2">No amenities specified</Typography>
                    )}
                  </Box>
                  
                  <Typography variant="subtitle1">Operating Hours:</Typography>
                  <Typography variant="body2">
                    {selectedPump.operatingHours || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailsDialog}>Close</Button>
              <Button 
                color={selectedPump.isVerified ? "warning" : "success"}
                onClick={() => {
                  handleCloseDetailsDialog();
                  handleOpenVerifyDialog(selectedPump);
                }}
              >
                {selectedPump.isVerified ? 'Unverify' : 'Verify'}
              </Button>
              <Button 
                color="error"
                onClick={() => {
                  handleCloseDetailsDialog();
                  handleOpenDeleteDialog(selectedPump);
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Petrol Pumps from Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Upload an Excel file containing petrol pump data. The file should have the following columns:
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1, mb: 2 }}>
              <ul>
                <li>Customer Name</li>
                <li>Dealer Name</li>
                <li>Address Line 1-4</li>
                <li>Contact</li>
                <li>Latitude</li>
                <li>Longitude</li>
                <li>Zone</li>
                <li>Sales Area</li>
                <li>SAP Code</li>
                <li>CO/CL/DO</li>
                <li>Pincode</li>
                <li>District</li>
                <li>Location</li>
              </ul>
            </Typography>

            <input
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              id="excel-file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="excel-file-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<UploadIcon />}
              >
                {importFile ? importFile.name : 'Choose Excel File'}
              </Button>
            </label>

            {importProgress > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Import Progress: {importProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={importProgress} />
              </Box>
            )}

            {importStatus === 'success' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Data imported successfully!
              </Alert>
            )}

            {importError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error: {importError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importFile || importStatus === 'processing'}
            variant="contained"
            startIcon={importStatus === 'processing' ? <CircularProgress size={20} /> : null}
          >
            {importStatus === 'processing' ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 