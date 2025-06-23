import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Tooltip
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

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

export default function ImportedData() {
  // For imported data display
  const [importedPumps, setImportedPumps] = useState([]);
  const [filteredPumps, setFilteredPumps] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dataColumns, setDataColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchImportedPumps();
  }, []);
  
  useEffect(() => {
    // Filter data based on search term
    if (searchTerm.trim() === '') {
      setFilteredPumps(importedPumps);
    } else {
      const filtered = importedPumps.filter(pump => {
        return Object.entries(pump).some(([key, value]) => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'object') return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
      setFilteredPumps(filtered);
    }
    setPage(0);
  }, [searchTerm, importedPumps]);

  // Fetch imported petrol pumps
  const fetchImportedPumps = async () => {
    setLoadingData(true);
    setError(null);
    try {
      // Query petrol pumps that have the importedAt field (indicating they were imported via Excel)
      const q = query(
        collection(db, 'petrolPumps'),
        where('importedAt', '!=', null),
        orderBy('importedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const pumps = [];
      querySnapshot.forEach((doc) => {
        pumps.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setImportedPumps(pumps);
      setFilteredPumps(pumps);
      
      // Dynamically determine columns from the data
      if (pumps.length > 0) {
        // Get all unique keys from all documents
        const allKeys = new Set();
        pumps.forEach(pump => {
          Object.keys(pump).forEach(key => {
            // Skip nested objects like location or complex objects
            if (typeof pump[key] !== 'object' || pump[key] === null) {
              allKeys.add(key);
            }
          });
        });
        
        // Convert Set to Array and remove internal fields
        const filteredKeys = Array.from(allKeys).filter(
          key => !['importedAt', 'verified', 'active', 'id'].includes(key)
        );
        
        // Add standard fields at the beginning
        const standardFields = ['id', 'verified', 'active'];
        setDataColumns([...standardFields, ...filteredKeys]);
      }
    } catch (error) {
      console.error("Error fetching imported pumps:", error);
      setError("Failed to load imported data. Please try again later.");
    } finally {
      setLoadingData(false);
    }
  };

  // For pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format cell value for display
  const formatCellValue = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Export data to Excel
  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredPumps);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ImportedPetrolPumps");
    XLSX.writeFile(workbook, "imported_petrol_pumps.xlsx");
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Imported Petrol Pump Data
        </Typography>
        <Button 
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportToExcel}
          disabled={filteredPumps.length === 0}
        >
          Export to Excel
        </Button>
      </Box>

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search imported data..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Box>
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchImportedPumps}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredPumps.length === 0 ? (
          <Alert severity="info">
            {searchTerm ? 'No results match your search.' : 'No imported petrol pump data found. Import data using the Excel Import tool.'}
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredPumps.length} records
                {searchTerm && ` for search: "${searchTerm}"`}
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {dataColumns.map((column) => (
                      <StyledTableCell key={column}>
                        {column === 'id' ? 'ID' : column.charAt(0).toUpperCase() + column.slice(1)}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPumps
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((pump) => (
                      <StyledTableRow key={pump.id}>
                        {dataColumns.map((column) => (
                          <TableCell key={`${pump.id}-${column}`}>
                            {column === 'verified' || column === 'active' ? (
                              <Chip 
                                size="small"
                                label={pump[column] ? 'Yes' : 'No'} 
                                color={pump[column] ? 'success' : 'error'}
                                variant="outlined"
                              />
                            ) : (
                              formatCellValue(pump[column])
                            )}
                          </TableCell>
                        ))}
                      </StyledTableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredPumps.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
} 