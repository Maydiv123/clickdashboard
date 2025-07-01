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
  CardContent
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Group as GroupIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

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

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.dark,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
}));

export default function TeamsEdit() {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editedTeam, setEditedTeam] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    memberCount: 'all',
    activeMembers: 'all'
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    filterTeams();
  }, [teams, searchQuery, filterOptions]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const teamsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      showSnackbar(`Error fetching teams: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterTeams = () => {
    let filtered = [...teams];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(team =>
        team.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.teamCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Member count filter
    if (filterOptions.memberCount !== 'all') {
      const count = parseInt(filterOptions.memberCount);
      filtered = filtered.filter(team => (team.memberCount || 0) >= count);
    }

    // Active members filter
    if (filterOptions.activeMembers !== 'all') {
      const count = parseInt(filterOptions.activeMembers);
      filtered = filtered.filter(team => (team.activeMembers || 0) >= count);
    }

    setFilteredTeams(filtered);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setEditedTeam({
      ...team,
      teamName: team.teamName || '',
      teamCode: team.teamCode || '',
      ownerId: team.ownerId || '',
      activeMembers: team.activeMembers || 0,
      memberCount: team.memberCount || 0,
      pendingRequests: team.pendingRequests || 0,
      teamStats: {
        totalUploads: team.teamStats?.totalUploads || 0,
        totalDistance: team.teamStats?.totalDistance || 0,
        totalVisits: team.teamStats?.totalVisits || 0,
        fuelConsumption: team.teamStats?.fuelConsumption || 0
      }
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editedTeam) return;
    
    setActionLoading(true);
    try {
      const teamDocRef = doc(db, 'teams', editedTeam.id);
      
      await updateDoc(teamDocRef, {
        teamName: editedTeam.teamName,
        teamCode: editedTeam.teamCode,
        ownerId: editedTeam.ownerId,
        activeMembers: editedTeam.activeMembers,
        memberCount: editedTeam.memberCount,
        pendingRequests: editedTeam.pendingRequests,
        teamStats: editedTeam.teamStats,
        updatedAt: new Date()
      });
      
      // Update state
      setTeams(prevTeams => prevTeams.map(team => 
        team.id === editedTeam.id ? editedTeam : team
      ));
      
      setFilteredTeams(prevTeams => prevTeams.map(team => 
        team.id === editedTeam.id ? editedTeam : team
      ));
      
      setActionLoading(false);
      setEditDialogOpen(false);
      showSnackbar('Team updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating team:', error);
      showSnackbar(`Error updating team: ${error.message}`, 'error');
      setActionLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedTeam(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedTeam(prev => ({
        ...prev,
        [field]: value
      }));
    }
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

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (field, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilterOptions({
      memberCount: 'all',
      activeMembers: 'all'
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.toDate()).toLocaleDateString();
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
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
          Edit Teams
        </Typography>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <SearchField
              placeholder="Search teams..."
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
              {(filterOptions.memberCount !== 'all' || filterOptions.activeMembers !== 'all') && (
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
          <InputLabel>Member Count</InputLabel>
          <Select
            value={filterOptions.memberCount}
            label="Member Count"
            onChange={(e) => handleFilterChange('memberCount', e.target.value)}
          >
            <MenuItem value="all">All Teams</MenuItem>
            <MenuItem value="1">1+ Members</MenuItem>
            <MenuItem value="5">5+ Members</MenuItem>
            <MenuItem value="10">10+ Members</MenuItem>
            <MenuItem value="20">20+ Members</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Active Members</InputLabel>
          <Select
            value={filterOptions.activeMembers}
            label="Active Members"
            onChange={(e) => handleFilterChange('activeMembers', e.target.value)}
          >
            <MenuItem value="all">All Teams</MenuItem>
            <MenuItem value="1">1+ Active</MenuItem>
            <MenuItem value="5">5+ Active</MenuItem>
            <MenuItem value="10">10+ Active</MenuItem>
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
          <Table sx={{ minWidth: 650 }} aria-label="teams table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Team ID</StyledTableCell>
                <StyledTableCell>Team Name</StyledTableCell>
                <StyledTableCell>Team Code</StyledTableCell>
                <StyledTableCell>Active Members</StyledTableCell>
                <StyledTableCell>Pending Requests</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredTeams
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((team) => (
                  <StyledTableRow key={team.id}>
                    <StyledTableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {team.id}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>{team.teamName || 'Unnamed Team'}</StyledTableCell>
                    <StyledTableCell>{team.teamCode || 'N/A'}</StyledTableCell>
                    <StyledTableCell>
                      <StyledChip
                        label={`${team.activeMembers || 0} members`}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip 
                        label={`${team.pendingRequests || 0} requests`}
                        color={team.pendingRequests > 0 ? 'warning' : 'default'}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell>{formatDate(team.createdAt)}</StyledTableCell>
                    <StyledTableCell align="right">
                      <IconButton
                        onClick={() => handleEditTeam(team)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {!loading && filteredTeams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No teams found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {searchQuery ? "Try adjusting your search query" : "No teams in this category"}
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
          count={filteredTeams.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Edit Team Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {editedTeam && (
          <>
            <DialogTitle>
              Edit Team
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Team Name"
                    value={editedTeam.teamName}
                    onChange={(e) => handleEditChange('teamName', e.target.value)}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Team Code"
                    value={editedTeam.teamCode}
                    onChange={(e) => handleEditChange('teamCode', e.target.value)}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CodeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Owner ID"
                    value={editedTeam.ownerId}
                    onChange={(e) => handleEditChange('ownerId', e.target.value)}
                    margin="normal"
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
                    type="number"
                    label="Active Members"
                    value={editedTeam.activeMembers}
                    onChange={(e) => handleEditChange('activeMembers', parseInt(e.target.value) || 0)}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NumbersIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Member Count"
                    value={editedTeam.memberCount}
                    onChange={(e) => handleEditChange('memberCount', parseInt(e.target.value) || 0)}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NumbersIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Pending Requests"
                    value={editedTeam.pendingRequests}
                    onChange={(e) => handleEditChange('pendingRequests', parseInt(e.target.value) || 0)}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NumbersIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                variant="contained" 
                color="primary"
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
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
} 