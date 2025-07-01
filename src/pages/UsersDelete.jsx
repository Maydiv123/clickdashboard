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
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover,
  Tab,
  Tabs,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';

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

const UserStatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(status === 'active' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.dark,
    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
  }),
  ...(status === 'blocked' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.dark,
    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
  }),
  ...(status === 'inactive' && {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    color: theme.palette.warning.dark,
    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
  })
}));

export default function UsersDelete() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [teamNameFilter, setTeamNameFilter] = useState('all');
  const [profileCompletionFilter, setProfileCompletionFilter] = useState('all');
  const [createdDateFilter, setCreatedDateFilter] = useState('all');

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    let filtered = [...users];
    if (newValue === 1) {
      filtered = filtered.filter(user => 
        user.preferredCompanies && user.preferredCompanies.includes('HPCL')
      );
    } else if (newValue === 2) {
      filtered = filtered.filter(user => 
        user.preferredCompanies && user.preferredCompanies.includes('BPCL')
      );
    } else if (newValue === 3) {
      filtered = filtered.filter(user => 
        user.preferredCompanies && user.preferredCompanies.includes('IOCL')
      );
    }
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, userTypeFilter, teamNameFilter, profileCompletionFilter, createdDateFilter, tabValue]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm) ||
        user.teamName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUserType = userTypeFilter === 'all' || user.userType === userTypeFilter;
      const matchesTeamName = teamNameFilter === 'all' || user.teamName === teamNameFilter;
      
      let matchesProfileCompletion = true;
      if (profileCompletionFilter !== 'all') {
        const completion = calculateProfileCompletion(user);
        const completionValue = parseInt(profileCompletionFilter);
        matchesProfileCompletion = completion >= completionValue;
      }

      let matchesCreatedDate = true;
      if (createdDateFilter !== 'all') {
        const userDate = user.createdAt?.toDate?.() || new Date(user.createdAt);
        const today = new Date();
        const filterDate = new Date();
        if (createdDateFilter === 'today') {
          filterDate.setDate(today.getDate() - 1);
        } else if (createdDateFilter === 'week') {
          filterDate.setDate(today.getDate() - 7);
        } else if (createdDateFilter === 'month') {
          filterDate.setMonth(today.getMonth() - 1);
        }
        matchesCreatedDate = userDate >= filterDate;
      }

      return matchesSearch && matchesUserType && matchesTeamName && matchesProfileCompletion && matchesCreatedDate;
    });

    // Apply tab filtering
    if (tabValue === 1) {
      filtered = filtered.filter(user => 
        user.preferredCompanies && user.preferredCompanies.includes('HPCL')
      );
    } else if (tabValue === 2) {
      filtered = filtered.filter(user => 
        user.preferredCompanies && user.preferredCompanies.includes('BPCL')
      );
    } else if (tabValue === 3) {
      filtered = filtered.filter(user => 
        user.preferredCompanies && user.preferredCompanies.includes('IOCL')
      );
    }

    setFilteredUsers(filtered);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleteLoading(true);
      
      await deleteDoc(doc(db, 'users', selectedUser.id));
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const clearFilters = () => {
    setUserTypeFilter('all');
    setTeamNameFilter('all');
    setProfileCompletionFilter('all');
    setCreatedDateFilter('all');
  };

  const getUniqueTeamNames = () => {
    const teamNames = users.map(user => user.teamName).filter(Boolean);
    return [...new Set(teamNames)];
  };

  const getUniqueUserTypes = () => {
    const userTypes = users.map(user => user.userType).filter(Boolean);
    return [...new Set(userTypes)];
  };

  const formatPreferredCompanies = (companies) => {
    if (!companies || companies.length === 0) return 'None';
    return companies.join(', ');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProfileCompletion = (user) => {
    let completion = 0;
    const fields = [
      'firstName', 'lastName', 'mobile', 'email', 'address', 
      'aadharNo', 'dob', 'preferredCompanies', 'teamCode', 'teamName'
    ];
    
    fields.forEach(field => {
      if (user[field]) {
        if (Array.isArray(user[field])) {
          if (user[field].length > 0) completion += 100 / fields.length;
        } else if (typeof user[field] === 'string' && user[field].trim() !== '') {
          completion += 100 / fields.length;
        }
      }
    });
    
    return Math.round(completion);
  };

  const getUserType = (user) => {
    return user.userType || 'user';
  };

  const getTeamStatus = (user) => {
    if (user.isTeamOwner) return 'Team Owner';
    if (user.teamMemberStatus === 'active') return 'Active Member';
    if (user.teamMemberStatus === 'inactive') return 'Inactive Member';
    return 'No Team';
  };

  const getInitials = (user) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserAvatar = (user) => {
    const stringToColor = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      let color = '#';
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
      }
      return color;
    };

    return {
      sx: {
        bgcolor: stringToColor(user.firstName + user.lastName),
        width: 40,
        height: 40,
        fontSize: '0.875rem',
        fontWeight: 600
      },
      children: getInitials(user)
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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
        <Typography variant="h4" fontWeight="bold">
          Delete Users
        </Typography>
      </Box>
      
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <SearchField
              placeholder="Search users..."
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
              sx={{ '.MuiTab-root': { fontWeight: 500, minWidth: 100 } }}
            >
              <Tab label="All Users" />
              <Tab label="HPCL" />
              <Tab label="BPCL" />
              <Tab label="IOCL" />
            </Tabs>
            
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 2 }}
              onClick={handleFilterClick}
            >
              Filter
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow>
                <StyledTableCell>User</StyledTableCell>
                <StyledTableCell>Mobile</StyledTableCell>
                <StyledTableCell>Type</StyledTableCell>
                <StyledTableCell>Profile Completion</StyledTableCell>
                <StyledTableCell>Created Date</StyledTableCell>
                <StyledTableCell>Preferred Companies</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <StyledTableRow key={user.id}>
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar {...getUserAvatar(user)}>
                          {getInitials(user)}
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {user.firstName} {user.lastName}
                          </Typography>
                        </Box>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>{user.mobile || 'N/A'}</StyledTableCell>
                    <StyledTableCell>{getUserType(user)}</StyledTableCell>
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateProfileCompletion(user)} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {calculateProfileCompletion(user)}%
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>{formatDate(user.createdAt)}</StyledTableCell>
                    <StyledTableCell>{formatPreferredCompanies(user.preferredCompanies)}</StyledTableCell>
                    <StyledTableCell align="right">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(user)}
                        sx={{ borderRadius: 2 }}
                      >
                        Delete
                      </Button>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No users found
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
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 2, width: 300, borderRadius: 2 } }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Filter Users
        </Typography>
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="user-type-filter-label">User Type</InputLabel>
          <Select
            labelId="user-type-filter-label"
            id="user-type-filter"
            value={userTypeFilter}
            label="User Type"
            onChange={e => setUserTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {getUniqueUserTypes().map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="team-name-filter-label">Team Name</InputLabel>
          <Select
            labelId="team-name-filter-label"
            id="team-name-filter"
            value={teamNameFilter}
            label="Team Name"
            onChange={e => setTeamNameFilter(e.target.value)}
          >
            <MenuItem value="all">All Teams</MenuItem>
            {getUniqueTeamNames().map(name => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="profile-completion-filter-label">Profile Completion</InputLabel>
          <Select
            labelId="profile-completion-filter-label"
            id="profile-completion-filter"
            value={profileCompletionFilter}
            label="Profile Completion"
            onChange={e => setProfileCompletionFilter(e.target.value)}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="0">0%</MenuItem>
            <MenuItem value="25">25%+</MenuItem>
            <MenuItem value="50">50%+</MenuItem>
            <MenuItem value="75">75%+</MenuItem>
            <MenuItem value="100">100%</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="created-date-filter-label">Created Date</InputLabel>
          <Select
            labelId="created-date-filter-label"
            id="created-date-filter"
            value={createdDateFilter}
            label="Created Date"
            onChange={e => setCreatedDateFilter(e.target.value)}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" size="small" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="contained" size="small" onClick={handleFilterClose}>
            Apply
          </Button>
        </Box>
      </Popover>

      {/* Delete Confirmation Dialog */}
      {selectedUser && (
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar {...getUserAvatar(selectedUser)} />
              <Box>
                <Typography variant="h6" color="error">
                  Delete User
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Are you sure you want to delete this user? This action cannot be undone.
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedUser.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                <Typography variant="body1">{selectedUser.mobile || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">User Type</Typography>
                <Typography variant="body1">{getUserType(selectedUser)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Team</Typography>
                <Typography variant="body1">{selectedUser.teamName || 'No Team'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography variant="body1">{formatDate(selectedUser.createdAt)}</Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              variant="contained"
              color="error"
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
} 