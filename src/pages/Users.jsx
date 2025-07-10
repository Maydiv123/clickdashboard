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
  Fab,
  Avatar,
  Tooltip,
  Divider,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Popover,
  LinearProgress,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
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
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy, addDoc } from 'firebase/firestore';

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

const companyOptions = ['HPCL', 'BPCL', 'IOCL'];
const professionOptions = [
  'Plumber',
  'Electrician', 
  'Supervisor',
  'Field boy',
  'Officer',
  'Site engineer',
  'Co-worker',
  'Mason',
  'Welder',
  'Carpenter'
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    userType: 'user',
    teamMemberStatus: 'inactive',
    address: '',
    aadharNo: '',
    dob: '',
    profession: '',
    preferredCompanies: [],
    teamCode: '',
    teamName: '',
    isTeamOwner: false,
    profileCompletion: 0,
    password: '',
    userId: '',
    isBlocked: false,
    createdAt: new Date(),
    isDummy: false
  });
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Information', 'Contact Details', 'Additional Information'];
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [teamNameFilter, setTeamNameFilter] = useState('');
  const [profileCompletionFilter, setProfileCompletionFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // View handler
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

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
        (user.profession && user.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.preferredCompanies && user.preferredCompanies.some(company => 
          company.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.userType === userTypeFilter);
    }
    if (teamNameFilter.trim() !== '') {
      filtered = filtered.filter(user => 
        user.teamName && user.teamName.toLowerCase().includes(teamNameFilter.toLowerCase())
      );
    }
    if (profileCompletionFilter !== 'all') {
      const completion = parseInt(profileCompletionFilter);
      console.log('Profile completion filter:', completion, 'Filtered users before:', filtered.length);
      filtered = filtered.filter(user => {
        const calculatedCompletion = calculateProfileCompletion(user);
        console.log('User:', user.firstName, 'Calculated completion:', calculatedCompletion);
        return calculatedCompletion >= completion;
      });
      console.log('Filtered users after profile completion filter:', filtered.length);
    }
    if (startDateFilter || endDateFilter) {
      filtered = filtered.filter(user => {
        const userCreatedAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        const startDate = startDateFilter ? new Date(startDateFilter) : null;
        const endDate = endDateFilter ? new Date(endDateFilter) : null;
        
        if (startDate && endDate) {
          return userCreatedAt >= startDate && userCreatedAt <= endDate;
        } else if (startDate) {
          return userCreatedAt >= startDate;
        } else if (endDate) {
          return userCreatedAt <= endDate;
        }
        return true;
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
  }, [searchTerm, users, userTypeFilter, teamNameFilter, profileCompletionFilter, startDateFilter, endDateFilter, tabValue]);

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

  // Create user handlers
  const handleOpenCreateDialog = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
      userType: 'user',
      teamMemberStatus: 'inactive',
      address: '',
      aadharNo: '',
      dob: '',
      profession: '',
      preferredCompanies: [],
      teamCode: '',
      teamName: '',
      isTeamOwner: false,
      profileCompletion: 0,
      password: '',
      userId: '',
      isBlocked: false,
      createdAt: new Date(),
      isDummy: false
    });
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleCreateChange = (field, value) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    clearFieldErrors(field, false);
  };

  const handleCreateUser = async () => {
    const isValid = validateCreateForm();
    if (!isValid) {
      setError('Please fix the validation errors below');
      return;
    }

    setActionLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const userDataRef = collection(db, 'user_data');
      
      const docRef = await addDoc(userDataRef, {
        ...newUser
      });
      
      // Add to state
      const createdUser = {
        id: docRef.id,
        ...newUser
      };
      
      setUsers(prevUsers => [createdUser, ...prevUsers]);
      setFilteredUsers(prevUsers => [createdUser, ...prevUsers]);
      
      setActionLoading(false);
      handleCloseCreateDialog();
      setActiveStep(0);
    } catch (error) {
      console.error('Error creating user:', error);
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

  const getTeamStatus = (user) => {
    return user.teamMemberStatus === 'active' 
      ? 'active'
      : user.isBlocked 
        ? 'blocked' 
        : 'inactive';
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
    setTeamNameFilter('');
    setProfileCompletionFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
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
  const validateCreateForm = () => {
    const errors = {};
    let hasErrors = false;
    
    // Required field validations
    if (!newUser.firstName.trim()) {
      errors.firstName = 'First name is required';
      hasErrors = true;
    }
    
    if (!newUser.userType.trim()) {
      errors.userType = 'User type is required';
      hasErrors = true;
    }
    
    if (!newUser.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
      hasErrors = true;
    } else if (!/^\d{10}$/.test(newUser.mobile.replace(/\s/g, ''))) {
      errors.mobile = 'Mobile number must be exactly 10 digits';
      hasErrors = true;
    }
    
    if (!newUser.password.trim()) {
      errors.password = 'MPIN is required';
      hasErrors = true;
    } else if (!/^\d{6}$/.test(newUser.password)) {
      errors.password = 'MPIN must be exactly 6 digits';
      hasErrors = true;
    }
    
    // Optional field validations
    if (newUser.aadharNo && !/^\d{12}$/.test(newUser.aadharNo.replace(/\s/g, ''))) {
      errors.aadharNo = 'Aadhar number must be exactly 12 digits';
      hasErrors = true;
    }
    
    if (newUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }
    
    if (!newUser.preferredCompanies || newUser.preferredCompanies.length === 0) {
      errors.preferredCompanies = 'Select at least one company';
      hasErrors = true;
    }
    
    setFieldErrors(errors);
    return !hasErrors;
  };



  // Input validation handlers
  const handleMobileChange = (value) => {
    // Only allow digits and limit to 10 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    handleCreateChange('mobile', cleaned);
  };

  const handlePasswordChange = (value) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    handleCreateChange('password', cleaned);
  };

  const handleAadharChange = (value) => {
    // Only allow digits and limit to 12 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    handleCreateChange('aadharNo', cleaned);
  };

  const clearFieldErrors = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderUserFields = (user) => {
    return (
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={user?.firstName || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={user?.lastName || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="User Type"
                value={getUserType(user) || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                value={user?.dob || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Profession"
                value={user?.profession || 'N/A'}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
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
                value={user?.email || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={user?.mobile || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sx={{ width: '560px' }}>
              <TextField
                fullWidth
                label="Address"
                value={user?.address || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                multiline
                rows={2}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
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
                label="Team Name"
                value={user?.teamName || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <GroupIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Team Code"
                value={user?.teamCode || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Team Member Status"
                value={user?.teamMemberStatus || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonAddIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Team Owner"
                value={user?.isTeamOwner ? 'Yes' : 'No'}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <AdminPanelSettingsIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
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
                label="Aadhar Number"
                value={user?.aadharNo || ''}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCardIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Profile Completion"
                value={`${calculateProfileCompletion(user)}%`}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CheckCircleIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Companies"
                value={formatPreferredCompanies(user?.preferredCompanies)}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Created Date"
                value={formatDate(user?.createdAt)}
                InputProps={{ 
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { backgroundColor: '#f8f9fa' } }}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    if (openCreateDialog) {
      setNewUser((prev) => ({
        ...prev,
        preferredCompanies: prev.preferredCompanies.length === 0 ? ['HPCL'] : prev.preferredCompanies
      }));
    }
  }, [openCreateDialog]);

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
          User Management
        </Typography>
        
        {/* <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />} 
          onClick={handleOpenCreateDialog}
          sx={{
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
          }}
        >
          Add New User
        </Button> */}
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
                <StyledTableCell>Profession</StyledTableCell>
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
                          {/* <Typography variant="body2" color="text.secondary">
                            {user.id}
                          </Typography> */}
                        </Box>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>{user.mobile || 'N/A'}</StyledTableCell>
                    <StyledTableCell>{getUserType(user)}</StyledTableCell>
                    <StyledTableCell>{user.profession || 'N/A'}</StyledTableCell>
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
                      <IconButton
                        onClick={() => handleViewUser(user)}
                        color="primary"
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
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

      {/* View User Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  User Details
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  View complete user information
                </Typography>
                <UserStatusChip
                  label={selectedUser.isBlocked ? 'Blocked' : 'Active'}
                  status={selectedUser.isBlocked ? 'blocked' : 'active'}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {renderUserFields(selectedUser)}
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button 
                onClick={() => setViewDialogOpen(false)}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create User Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog} 
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
            <PersonAddIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Create New User
            </Typography>
          </Box>
        </DialogTitle>
        
        <Stepper activeStep={activeStep} sx={{ px: 3, py: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            {activeStep === 0 && (
              <Grid container spacing={3} direction="column">
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Basic Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={newUser.firstName}
                    onChange={(e) => handleCreateChange('firstName', e.target.value)}
                    required
                    error={!!fieldErrors.firstName}
                    helperText={fieldErrors.firstName}
                    placeholder="Enter first name"
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
                    label="Last Name"
                    value={newUser.lastName}
                    onChange={(e) => handleCreateChange('lastName', e.target.value)}
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
                    label="Date of Birth"
                    type="date"
                    value={newUser.dob}
                    onChange={(e) => handleCreateChange('dob', e.target.value)}
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
                {/* User Type */}
                
                
                {/* Profession - Dropdown to select user's profession from predefined options */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Profession</InputLabel>
                    <Select
                      value={newUser.profession}
                      onChange={(e) => handleCreateChange('profession', e.target.value)}
                      label="Profession"
                      startAdornment={
                        <InputAdornment position="start">
                          <BusinessIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">Select Profession</MenuItem>
                      {professionOptions.map((profession) => (
                        <MenuItem key={profession} value={profession}>
                          {profession}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3} direction="column">
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Contact Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleCreateChange('email', e.target.value)}
                    error={!!fieldErrors.email}
                    helperText={fieldErrors.email}
                    placeholder="Enter email address (optional)"
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mobile"
                    value={newUser.mobile}
                    onChange={(e) => handleMobileChange(e.target.value, false)}
                    required
                    error={!!fieldErrors.mobile}
                    helperText={fieldErrors.mobile}
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={newUser.address}
                    onChange={(e) => handleCreateChange('address', e.target.value)}
                    variant="outlined"
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="MPIN"
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => handlePasswordChange(e.target.value, false)}
                    required
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password}
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
                            onClick={() => handleTogglePasswordVisibility(false)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Aadhar Number"
                    value={newUser.aadharNo}
                    onChange={(e) => handleAadharChange(e.target.value, false)}
                    error={!!fieldErrors.aadharNo}
                    helperText={fieldErrors.aadharNo}
                    placeholder="Enter exactly 12 digits (optional)"
                    margin="normal"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3} direction="column">
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Team Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Team Code"
                    value={newUser.teamCode}
                    onChange={(e) => handleCreateChange('teamCode', e.target.value)}
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
                    label="Team Name"
                    value={newUser.teamName}
                    onChange={(e) => handleCreateChange('teamName', e.target.value)}
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
                  <FormControl fullWidth>
                    <InputLabel>Is Team Owner</InputLabel>
                    <Select
                      value={newUser.isTeamOwner ? 'true' : 'false'}
                      onChange={(e) => handleCreateChange('isTeamOwner', e.target.value === 'true')}
                      label="Is Team Owner"
                      startAdornment={
                        <InputAdornment position="start">
                          <GroupIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="false">No</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" required>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Preferred Companies
                    </Typography>
                    <FormGroup row>
                      {companyOptions.map((company) => (
                        <FormControlLabel
                          key={company}
                          control={
                            <Checkbox
                              checked={newUser.preferredCompanies.includes(company)}
                              onChange={(e) => {
                                let updated = [...newUser.preferredCompanies];
                                if (e.target.checked) {
                                  updated.push(company);
                                } else {
                                  if (updated.length === 1) return; // Prevent removing last
                                  updated = updated.filter((c) => c !== company);
                                }
                                setNewUser((prev) => ({ ...prev, preferredCompanies: updated }));
                                clearFieldErrors('preferredCompanies', false);
                              }}
                              name={company}
                            />
                          }
                          label={company}
                        />
                      ))}
                    </FormGroup>
                    {fieldErrors.preferredCompanies && (
                      <Typography variant="caption" color="error">
                        {fieldErrors.preferredCompanies}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseCreateDialog} 
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep((prev) => prev - 1)}
              variant="outlined"
              sx={{ borderRadius: 2, px: 3, mr: 1 }}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={() => setActiveStep((prev) => prev + 1)}
              variant="contained"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleCreateUser} 
              variant="contained"
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Create User
            </Button>
          )}
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
        <Autocomplete
          fullWidth
          size="small"
          options={getUniqueTeamNames()}
          value={teamNameFilter}
          onChange={(event, newValue) => setTeamNameFilter(newValue || '')}
          onInputChange={(event, newInputValue) => setTeamNameFilter(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Team Name"
              placeholder="Search team names..."
              variant="outlined"
              margin="normal"
            />
          )}
          freeSolo
          disableClearable={false}
          clearOnBlur={false}
          selectOnFocus
          handleHomeEndKeys
        />
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
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Created Date Range
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" size="small" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="contained" size="small" onClick={handleFilterClose}>
            Apply
          </Button>
        </Box>
      </Popover>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleOpenCreateDialog}
        sx={{ 
          position: 'fixed', 
          bottom: 32, 
          right: 32,
          boxShadow: '0 8px 16px rgba(58, 134, 255, 0.3)'
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
} 