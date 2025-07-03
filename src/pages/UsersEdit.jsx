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
  MenuItem,
  Alert,
  Avatar,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Popover,
  LinearProgress,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarTodayIcon,
  ContactPhone as ContactPhoneIcon,
  QrCode as QrCodeIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Info as InfoIcon,
  CreditCard as CreditCardIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';

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

const companyOptions = ['HPCL', 'BPCL', 'IOCL'];

export default function UsersEdit() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [teamNameFilter, setTeamNameFilter] = useState('all');
  const [profileCompletionFilter, setProfileCompletionFilter] = useState('all');
  const [createdDateFilter, setCreatedDateFilter] = useState('all');
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [showEditPassword, setShowEditPassword] = useState(false);

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

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Starting to fetch users...');
        const usersRef = collection(db, 'user_data');
        console.log('Collection reference created');
        
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        console.log('Query created');
        
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot received:', querySnapshot.size, 'documents');
        
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter out dummy users
        const filteredUsers = usersData.filter(user => !user.isDummy);
        
        console.log('Processed users data:', filteredUsers);
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = [...users];
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.mobile && user.mobile.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.userType && user.userType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.userId && user.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.teamName && user.teamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.preferredCompanies && user.preferredCompanies.some(company => 
          company.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.userType === userTypeFilter);
    }
    if (teamNameFilter !== 'all') {
      filtered = filtered.filter(user => user.teamName === teamNameFilter);
    }
    if (profileCompletionFilter !== 'all') {
      const completion = parseInt(profileCompletionFilter);
      filtered = filtered.filter(user => {
        const calculatedCompletion = calculateProfileCompletion(user);
        return calculatedCompletion >= completion;
      });
    }
    if (createdDateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      if (createdDateFilter === 'today') {
        filterDate.setDate(now.getDate() - 1);
      } else if (createdDateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (createdDateFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }
      filtered = filtered.filter(user => {
        const userCreatedAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return userCreatedAt >= filterDate;
      });
    }
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
  }, [searchTerm, users, userTypeFilter, teamNameFilter, profileCompletionFilter, createdDateFilter, tabValue]);

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

  // Edit user handlers
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditedUser({
      ...user,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobile: user.mobile || '',
      email: user.email || '',
      userType: user.userType || 'user',
      teamMemberStatus: user.teamMemberStatus || 'inactive',
      address: user.address || '',
      aadharNo: user.aadharNo || '',
      dob: user.dob || '',
      preferredCompanies: user.preferredCompanies || [],
      teamCode: user.teamCode || '',
      teamName: user.teamName || '',
      isTeamOwner: user.isTeamOwner || false,
      profileCompletion: user.profileCompletion || 0,
      password: user.password || '',
      userId: user.userId || user.id,
      isBlocked: user.isBlocked || false
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setEditedUser(null);
  };

  const handleEditChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    clearFieldErrors(field);
  };

  const handleSaveEdit = async () => {
    if (!editedUser) return;
    
    const isValid = validateEditForm();
    if (!isValid) {
      setError('Please fix the validation errors below');
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setEditFieldErrors({});
    
    try {
      const userDocRef = doc(db, 'user_data', editedUser.id);
      
      await updateDoc(userDocRef, {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        mobile: editedUser.mobile,
        email: editedUser.email,
        userType: editedUser.userType,
        teamMemberStatus: editedUser.teamMemberStatus,
        address: editedUser.address,
        aadharNo: editedUser.aadharNo,
        dob: editedUser.dob,
        preferredCompanies: editedUser.preferredCompanies,
        teamCode: editedUser.teamCode,
        teamName: editedUser.teamName,
        isTeamOwner: editedUser.isTeamOwner,
        profileCompletion: editedUser.profileCompletion,
        password: editedUser.password,
        userId: editedUser.userId,
        isBlocked: editedUser.isBlocked,
        updatedAt: new Date()
      });
      
      // Update state
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === editedUser.id ? editedUser : user
      ));
      
      setFilteredUsers(prevUsers => prevUsers.map(user => 
        user.id === editedUser.id ? editedUser : user
      ));
      
      setActionLoading(false);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message);
      setActionLoading(false);
    }
  };

  const getUserType = (user) => {
    return user.userType === 'admin' 
      ? 'Admin' 
      : user.userType === 'Team Leader' 
        ? 'Team Leader' 
        : 'User';
  };

  const getInitials = (user) => {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const getUserAvatar = (user) => {
    const randomColors = ['#3a86ff', '#ff006e', '#8338ec', '#fb5607', '#ffbe0b', '#3a0ca3'];
    const stringToColor = (str) => {
      if (!str) return randomColors[0];
      const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
      return randomColors[hash % randomColors.length];
    };
    
    return {
      sx: { bgcolor: stringToColor(user.id) }
    };
  };

  // Filter popover handlers
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
    setFilterAnchorEl(null);
  };
  const getUniqueTeamNames = () => {
    return users
      .map(user => user.teamName)
      .filter(name => name && name.trim() !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  };

  const getUniqueUserTypes = () => {
    return users
      .map(user => user.userType)
      .filter(type => type && type.trim() !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPreferredCompanies = (companies) => {
    if (!companies || companies.length === 0) return 'None';
    return companies.join(', ');
  };

  const calculateProfileCompletion = (user) => {
    let completedFields = 0;
    let totalFields = 0;
    
    // Basic Information (40% weight)
    totalFields += 4;
    if (user.firstName && user.firstName.trim()) completedFields++;
    if (user.lastName && user.lastName.trim()) completedFields++;
    if (user.mobile && user.mobile.trim()) completedFields++;
    if (user.userId && user.userId.trim()) completedFields++;
    
    // Contact & Location (30% weight)
    totalFields += 3;
    if (user.location && user.location.latitude && user.location.longitude) completedFields++;
    if (user.lastLocationUpdate) completedFields++;
    if (user.lastLogin) completedFields++;
    
    // Preferences & Team (20% weight)
    totalFields += 2;
    if (user.preferredCompanies && user.preferredCompanies.length > 0) completedFields++;
    if (user.teamId || user.teamName) completedFields++;
    
    // Stats & Activity (10% weight)
    totalFields += 1;
    if (user.stats && (user.stats.visits > 0 || user.stats.uploads > 0)) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  // Validation functions
  const validateEditForm = () => {
    const errors = {};
    let hasErrors = false;
    
    // Required field validations
    if (!editedUser.firstName.trim()) {
      errors.firstName = 'First name is required';
      hasErrors = true;
    }
    
    if (!editedUser.userType.trim()) {
      errors.userType = 'User type is required';
      hasErrors = true;
    }
    
    if (!editedUser.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
      hasErrors = true;
    } else if (!/^\d{10}$/.test(editedUser.mobile.replace(/\s/g, ''))) {
      errors.mobile = 'Mobile number must be exactly 10 digits';
      hasErrors = true;
    }
    
    if (editedUser.password && !/^\d{6}$/.test(editedUser.password)) {
      errors.password = 'MPIN must be exactly 6 digits';
      hasErrors = true;
    }
    
    // Optional field validations
    if (editedUser.aadharNo && !/^\d{12}$/.test(editedUser.aadharNo.replace(/\s/g, ''))) {
      errors.aadharNo = 'Aadhar number must be exactly 12 digits';
      hasErrors = true;
    }
    
    if (editedUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedUser.email)) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }
    
    if (!editedUser.preferredCompanies || editedUser.preferredCompanies.length === 0) {
      errors.preferredCompanies = 'Select at least one company';
      hasErrors = true;
    }
    
    setEditFieldErrors(errors);
    return !hasErrors;
  };

  // Input validation handlers
  const handleMobileChange = (value) => {
    // Only allow digits and limit to 10 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    handleEditChange('mobile', cleaned);
  };

  const handlePasswordChange = (value) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    handleEditChange('password', cleaned);
  };

  const handleAadharChange = (value) => {
    // Only allow digits and limit to 12 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    handleEditChange('aadharNo', cleaned);
  };

  const clearFieldErrors = (field) => {
    if (editFieldErrors[field]) {
      setEditFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowEditPassword(!showEditPassword);
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
          Edit Users
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
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditDialog(user)}
                        sx={{ borderRadius: 2 }}
                      >
                        Edit
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

      {/* Edit User Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Edit User
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Update user information and settings
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {editedUser && (
            <Box sx={{ mt: 2 }}>
              {/* Basic Information Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    Basic Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={editedUser.firstName}
                      onChange={(e) => handleEditChange('firstName', e.target.value)}
                      required
                      error={!!editFieldErrors.firstName}
                      helperText={editFieldErrors.firstName}
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
                  <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={editedUser.lastName}
                      onChange={(e) => handleEditChange('lastName', e.target.value)}
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
                  {/* <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="User ID"
                      value={editedUser.userId}
                      onChange={(e) => handleEditChange('userId', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid> */}
                  <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={editedUser.dob}
                      onChange={(e) => handleEditChange('dob', e.target.value)}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Contact Information Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ContactPhoneIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    Contact Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={editedUser.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mobile"
                      value={editedUser.mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      required
                      error={!!editFieldErrors.mobile}
                      helperText={editFieldErrors.mobile}
                      placeholder="Enter exactly 10 digits (e.g., 9876543210)"
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
                  <Grid item xs={12} sx={{ width: '560px' }}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={editedUser.address}
                      onChange={(e) => handleEditChange('address', e.target.value)}
                      variant="outlined"
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* User Type & Status Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BadgeIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    User Type & Status
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} sx={{ width: '150px' }}>
                    <FormControl fullWidth required error={!!editFieldErrors.userType}>
                      <InputLabel>User Type</InputLabel>
                      <Select
                        value={editedUser.userType}
                        onChange={(e) => handleEditChange('userType', e.target.value)}
                        label="User Type"
                        startAdornment={
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="Team Leader">Team Leader</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="individual">Individual</MenuItem>
                        <MenuItem value="teamMember">Team Member</MenuItem>
                        <MenuItem value="teamOwner">Team Owner</MenuItem>
                      </Select>
                      {editFieldErrors.userType && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {editFieldErrors.userType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: '150px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Team Member Status</InputLabel>
                      <Select
                        value={editedUser.teamMemberStatus}
                        onChange={(e) => handleEditChange('teamMemberStatus', e.target.value)}
                        label="Team Member Status"
                        startAdornment={
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {/* Team Information Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    Team Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Team Code"
                      value={editedUser.teamCode}
                      onChange={(e) => handleEditChange('teamCode', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QrCodeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Team Name"
                      value={editedUser.teamName}
                      onChange={(e) => handleEditChange('teamName', e.target.value)}
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
                  {/* <Grid item xs={12} sm={6} sx={{ width: '150px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Is Team Owner</InputLabel>
                      <Select
                        value={editedUser.isTeamOwner ? 'true' : 'false'}
                        onChange={(e) => handleEditChange('isTeamOwner', e.target.value === 'true')}
                        label="Is Team Owner"
                        startAdornment={
                          <InputAdornment position="start">
                            <AdminPanelSettingsIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid> */}
                  {/* <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Profile Completion (%)"
                      type="number"
                      value={editedUser.profileCompletion}
                      onChange={(e) => handleEditChange('profileCompletion', parseInt(e.target.value) || 0)}
                      variant="outlined"
                      inputProps={{ min: 0, max: 100 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckCircleIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid> */}
                </Grid>
              </Box>

              {/* Additional Information Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    Additional Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="MPIN"
                      type={showEditPassword ? 'text' : 'password'}
                      value={editedUser.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      error={!!editFieldErrors.password}
                      helperText={editFieldErrors.password}
                      placeholder="Enter exactly 6 digits"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {showEditPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Aadhar Number"
                      value={editedUser.aadharNo}
                      onChange={(e) => handleAadharChange(e.target.value)}
                      error={!!editFieldErrors.aadharNo}
                      helperText={editFieldErrors.aadharNo}
                      placeholder="Enter exactly 12 digits (optional)"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CreditCardIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {/* <Grid item xs={12} sm={6} sx={{ width: '150px' }}>
                    <FormControl fullWidth>
                      <InputLabel>Blocked Status</InputLabel>
                      <Select
                        value={editedUser.isBlocked ? 'true' : 'false'}
                        onChange={(e) => handleEditChange('isBlocked', e.target.value === 'true')}
                        label="Blocked Status"
                        startAdornment={
                          <InputAdornment position="start">
                            <BlockIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="false">Not Blocked</MenuItem>
                        <MenuItem value="true">Blocked</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid> */}
                  <Grid item xs={12}>
                    <FormControl component="fieldset" required error={!!editFieldErrors.preferredCompanies}>
                      <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="action" fontSize="small" />
                        Preferred Companies
                      </Typography>
                      <FormGroup row>
                        {companyOptions.map((company) => (
                          <FormControlLabel
                            key={company}
                            control={
                              <Checkbox
                                checked={editedUser.preferredCompanies?.includes(company)}
                                onChange={(e) => {
                                  let updated = [...(editedUser.preferredCompanies || [])];
                                  if (e.target.checked) {
                                    updated.push(company);
                                  } else {
                                    if (updated.length === 1) return; // Prevent removing last
                                    updated = updated.filter((c) => c !== company);
                                  }
                                  setEditedUser((prev) => ({ ...prev, preferredCompanies: updated }));
                                  clearFieldErrors('preferredCompanies');
                                }}
                                name={company}
                              />
                            }
                            label={company}
                          />
                        ))}
                      </FormGroup>
                      {editFieldErrors.preferredCompanies && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {editFieldErrors.preferredCompanies}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseEditDialog} 
            variant="outlined"
            color="inherit"
            sx={{ 
              borderRadius: 2, 
              px: 3, 
              py: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ 
              borderRadius: 2, 
              px: 3, 
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
} 