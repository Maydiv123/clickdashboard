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
  Checkbox,
  FormGroup,
  FormControlLabel,
  Popover,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

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
    cursor: 'pointer',
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

const companyOptions = ['HPCL', 'BPCL', 'IOCL'];

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openUserDetails, setOpenUserDetails] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [teamNameFilter, setTeamNameFilter] = useState('all');
  const [profileCompletionFilter, setProfileCompletionFilter] = useState('all');
  const [createdDateFilter, setCreatedDateFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, userTypeFilter, teamNameFilter, profileCompletionFilter, createdDateFilter]);

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
        if (profileCompletionFilter === 'complete' && completion < 100) matchesProfileCompletion = false;
        if (profileCompletionFilter === 'incomplete' && completion >= 100) matchesProfileCompletion = false;
      }

      let matchesCreatedDate = true;
      if (createdDateFilter !== 'all') {
        const userDate = user.createdAt?.toDate?.() || new Date(user.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - userDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (createdDateFilter === 'today' && diffDays > 1) matchesCreatedDate = false;
        if (createdDateFilter === 'week' && diffDays > 7) matchesCreatedDate = false;
        if (createdDateFilter === 'month' && diffDays > 30) matchesCreatedDate = false;
      }

      return matchesSearch && matchesUserType && matchesTeamName && matchesProfileCompletion && matchesCreatedDate;
    });

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

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setOpenUserDetails(true);
  };

  const handleCloseUserDetails = () => {
    setOpenUserDetails(false);
    setSelectedUser(null);
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

  const formatPreferredCompanies = (companies) => {
    if (!companies || companies.length === 0) return 'None';
    return companies.join(', ');
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
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              View Users
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <SearchField
                placeholder="Search users..."
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
              <Tooltip title="Filter">
                <IconButton onClick={handleFilterClick} color="primary">
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>User</StyledTableCell>
                  <StyledTableCell>Contact</StyledTableCell>
                  <StyledTableCell>Team</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Profile Completion</StyledTableCell>
                  <StyledTableCell>Created</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <StyledTableRow key={user.id} onClick={() => handleRowClick(user)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar {...getUserAvatar(user)} />
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getUserType(user)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <EmailIcon fontSize="small" color="action" />
                            {user.email || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            {user.mobile || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.teamName || 'No Team'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getTeamStatus(user)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <UserStatusChip
                          label={user.isBlocked ? 'Blocked' : 'Active'}
                          status={user.isBlocked ? 'blocked' : 'active'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProfileCompletion(user)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 35 }}>
                            {calculateProfileCompletion(user)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(user);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </StyledTableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>User Type</InputLabel>
              <Select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                label="User Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {getUniqueUserTypes().map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Team Name</InputLabel>
              <Select
                value={teamNameFilter}
                onChange={(e) => setTeamNameFilter(e.target.value)}
                label="Team Name"
              >
                <MenuItem value="all">All Teams</MenuItem>
                {getUniqueTeamNames().map(team => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Profile Completion</InputLabel>
              <Select
                value={profileCompletionFilter}
                onChange={(e) => setProfileCompletionFilter(e.target.value)}
                label="Profile Completion"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="complete">Complete (100%)</MenuItem>
                <MenuItem value="incomplete">Incomplete</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Created Date</InputLabel>
              <Select
                value={createdDateFilter}
                onChange={(e) => setCreatedDateFilter(e.target.value)}
                label="Created Date"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Popover>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog
          open={openUserDetails}
          onClose={handleCloseUserDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar {...getUserAvatar(selectedUser)} />
              <Box>
                <Typography variant="h6">
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.email}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">User Type</Typography>
                    <Typography variant="body1">{getUserType(selectedUser)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Mobile</Typography>
                    <Typography variant="body1">{selectedUser.mobile || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedUser.email || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{selectedUser.dob || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Aadhar Number</Typography>
                    <Typography variant="body1">{selectedUser.aadharNo || 'N/A'}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>Team Information</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Team Name</Typography>
                    <Typography variant="body1">{selectedUser.teamName || 'No Team'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Team Code</Typography>
                    <Typography variant="body1">{selectedUser.teamCode || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Team Status</Typography>
                    <Typography variant="body1">{getTeamStatus(selectedUser)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Is Team Owner</Typography>
                    <Typography variant="body1">{selectedUser.isTeamOwner ? 'Yes' : 'No'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Preferred Companies</Typography>
                    <Typography variant="body1">{formatPreferredCompanies(selectedUser.preferredCompanies)}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Additional Information</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body1">{selectedUser.address || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Account Status</Typography>
                    <UserStatusChip
                      label={selectedUser.isBlocked ? 'Blocked' : 'Active'}
                      status={selectedUser.isBlocked ? 'blocked' : 'active'}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Profile Completion</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProfileCompletion(selectedUser)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {calculateProfileCompletion(selectedUser)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Created At</Typography>
                    <Typography variant="body1">{formatDate(selectedUser.createdAt)}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
} 