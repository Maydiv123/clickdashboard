import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress
} from '@mui/material';
import {
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  TableView as TableViewIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.default,
  border: `2px dashed ${theme.palette.primary.light}`,
  borderRadius: theme.shape.borderRadius * 2,
  minHeight: 200,
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  padding: theme.spacing(1.5),
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  }
}));

export default function ExcelImport() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [excelData, setExcelData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const steps = ['Upload Excel File', 'Preview Data', 'Import to Database'];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          setAlert({ 
            open: true, 
            message: 'The Excel file is empty!', 
            severity: 'error' 
          });
          setIsLoading(false);
          return;
        }

        // Extract column headers
        const cols = Object.keys(jsonData[0]);
        setColumns(cols);
        setExcelData(jsonData);
        setActiveStep(1);
        
        setAlert({ 
          open: true, 
          message: `Successfully loaded ${jsonData.length} records from ${file.name}`, 
          severity: 'success' 
        });
      } catch (error) {
        setAlert({ 
          open: true, 
          message: `Error parsing Excel file: ${error.message}`, 
          severity: 'error' 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setAlert({ 
        open: true, 
        message: 'Failed to read the Excel file', 
        severity: 'error' 
      });
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleConfirmImport = () => {
    setConfirmDialogOpen(true);
  };

  const handleStartImport = async () => {
    setConfirmDialogOpen(false);
    setActiveStep(2);
    setIsLoading(true);
    setProgress({ current: 0, total: excelData.length });
    
    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < excelData.length; i++) {
        const pump = excelData[i];
        
        try {
          // Process data before adding to Firestore
          const processedPump = processPumpData(pump);
          
          // Add document to 'petrolPumps' collection
          await addDoc(collection(db, 'petrolPumps'), {
            ...processedPump,
            importedAt: serverTimestamp(),
            verified: false,
            active: true,
          });
          
          successCount++;
        } catch (error) {
          console.error('Error importing row:', error);
          failedCount++;
        }
        
        setProgress({ current: i + 1, total: excelData.length });
      }
      
      setImportResults({ success: successCount, failed: failedCount });
      
      setAlert({
        open: true,
        message: `Import completed: ${successCount} added successfully, ${failedCount} failed`,
        severity: failedCount > 0 ? 'warning' : 'success'
      });
      
    } catch (error) {
      setAlert({
        open: true,
        message: `Import failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process data to extract coordinates if available
  const processPumpData = (pump) => {
    const processedPump = { ...pump };

    // Look for possible latitude/longitude columns with flexible naming
    const latColumns = ['latitude', 'lat', 'y', 'latitud', 'latitude_degree'];
    const lngColumns = ['longitude', 'lng', 'long', 'x', 'longitud', 'longitude_degree'];
    
    // Try to find latitude and longitude
    let latitude = null;
    let longitude = null;
    
    for (const key of Object.keys(pump)) {
      const lowerKey = key.toLowerCase();
      
      // Check for latitude
      if (!latitude && latColumns.some(col => lowerKey.includes(col))) {
        const value = parseFloat(pump[key]);
        if (!isNaN(value) && value >= -90 && value <= 90) {
          latitude = value;
        }
      }
      
      // Check for longitude
      if (!longitude && lngColumns.some(col => lowerKey.includes(col))) {
        const value = parseFloat(pump[key]);
        if (!isNaN(value) && value >= -180 && value <= 180) {
          longitude = value;
        }
      }
    }

    // If we found lat/lng, add as location field
    if (latitude !== null && longitude !== null) {
      processedPump.location = { 
        latitude,
        longitude
      };
    }

    return processedPump;
  };

  const resetForm = () => {
    setExcelData([]);
    setColumns([]);
    setFileName('');
    setActiveStep(0);
    setProgress({ current: 0, total: 0 });
    setImportResults({ success: 0, failed: 0 });
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const navigateToImportedData = () => {
    navigate('/imported-data');
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Excel Import - Petrol Pumps
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Import petrol pump data from Excel files. All data from the sheet will be stored in the database.
      </Typography>

      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 3,
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 4 }} />

        {activeStep === 0 && (
          <Box>
            <UploadBox component="label">
              <CloudUploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Excel File
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" paragraph>
                Click or drag and drop an Excel file (.xlsx, .xls)
              </Typography>
              <Button
                component="span"
                variant="contained"
                startIcon={<UploadIcon />}
                disabled={isLoading}
              >
                Select File
              </Button>
              <VisuallyHiddenInput
                type="file"
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
              />
              {isLoading && (
                <CircularProgress size={24} sx={{ mt: 2 }} />
              )}
            </UploadBox>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                startIcon={<TableViewIcon />}
                onClick={navigateToImportedData}
              >
                View Imported Data
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                File: {fileName} ({excelData.length} records)
              </Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  onClick={togglePreview} 
                  sx={{ mr: 1 }}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleConfirmImport}
                >
                  Import to Database
                </Button>
              </Box>
            </Box>

            {showPreview && (
              <TableContainer sx={{ maxHeight: 400, mb: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <StyledTableCell key={column}>
                          {column}
                        </StyledTableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {excelData.slice(0, 10).map((row, index) => (
                      <StyledTableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column}>
                            {row[column]?.toString() || ''}
                          </TableCell>
                        ))}
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
                {excelData.length > 10 && (
                  <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing 10 of {excelData.length} records
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            )}
            
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
              <Typography variant="body2">
                The import will create {excelData.length} petrol pump records in the database.
                All columns from your Excel file will be imported.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button onClick={resetForm} startIcon={<DeleteIcon />} variant="outlined" color="error">
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Importing Data to Database
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Processing record {progress.current} of {progress.total}
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Box sx={{ position: 'relative', pt: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(progress.current / progress.total) * 100} 
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {Math.round((progress.current / progress.total) * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Import Completed
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 3 }}>
                    <Chip 
                      icon={<CheckIcon />} 
                      label={`${importResults.success} Records Imported`}
                      color="success"
                      variant="outlined"
                    />
                    {importResults.failed > 0 && (
                      <Chip 
                        icon={<CloseIcon />} 
                        label={`${importResults.failed} Failed`}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={resetForm}
                      startIcon={<UploadIcon />}
                    >
                      Import Another File
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<TableViewIcon />}
                      onClick={navigateToImportedData}
                    >
                      View Imported Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Paper>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <Typography>
            You're about to import {excelData.length} records to the database. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStartImport} variant="contained" color="primary">
            Import Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 