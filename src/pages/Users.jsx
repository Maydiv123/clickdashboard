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
  StepLabel
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon
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

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [userToToggleBlock, setUserToToggleBlock] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState(null);
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
    preferredCompanies: [],
    createdAt: new Date(),
    isDummy: false
  });
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Information', 'Contact Details', 'Additional Information'];

  // Menu handlers
  const handleOpenMenu = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(user);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Starting to fetch users...');
        const usersRef = collection(db, 'users');
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

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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

  // Delete user handlers
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', userToDelete.id);
      await deleteDoc(userRef);
      
      // Remove from state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      
      setActionLoading(false);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message);
      setActionLoading(false);
    }
  };

  // Block/Unblock user handlers
  const handleOpenBlockDialog = (user) => {
    setUserToToggleBlock(user);
    setOpenBlockDialog(true);
    handleCloseMenu();
  };

  const handleCloseBlockDialog = () => {
    setOpenBlockDialog(false);
    setUserToToggleBlock(null);
  };

  const handleToggleBlockUser = async () => {
    if (!userToToggleBlock) return;
    
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', userToToggleBlock.id);
      const newBlockedStatus = !userToToggleBlock.isBlocked;
      
      await updateDoc(userRef, {
        isBlocked: newBlockedStatus
      });
      
      // Update state
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === userToToggleBlock.id 
          ? { ...user, isBlocked: newBlockedStatus } 
          : user
      ));
      
      setFilteredUsers(prevUsers => prevUsers.map(user => 
        user.id === userToToggleBlock.id 
          ? { ...user, isBlocked: newBlockedStatus } 
          : user
      ));
      
      setActionLoading(false);
      handleCloseBlockDialog();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.message);
      setActionLoading(false);
    }
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
      preferredCompanies: user.preferredCompanies || []
    });
    setOpenEditDialog(true);
    handleCloseMenu();
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
  };

  const handleSaveEdit = async () => {
    if (!editedUser) return;
    
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', editedUser.id);
      
      await updateDoc(userRef, {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        mobile: editedUser.mobile,
        email: editedUser.email,
        userType: editedUser.userType,
        teamMemberStatus: editedUser.teamMemberStatus,
        address: editedUser.address,
        aadharNo: editedUser.aadharNo,
        dob: editedUser.dob,
        preferredCompanies: editedUser.preferredCompanies
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
      preferredCompanies: [],
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
  };

  const handleCreateUser = async () => {
    setActionLoading(true);
    try {
      const usersRef = collection(db, 'users');
      
      const docRef = await addDoc(usersRef, {
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
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message);
      setActionLoading(false);
    }
  };

  const getUserType = (user) => {
    return user.userType === 'admin' 
      ? 'Admin' 
      : user.userType === 'team_leader' 
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
        
        <Button 
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
        </Button>
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
              <Tab label="Active" />
              <Tab label="Blocked" />
            </Tabs>
            
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 2 }}
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
                <StyledTableCell>Email</StyledTableCell>
                <StyledTableCell>Mobile</StyledTableCell>
                <StyledTableCell>Type</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
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
                          <Typography variant="body2" color="text.secondary">
                            {user.id}
                          </Typography>
                        </Box>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>{user.email}</StyledTableCell>
                    <StyledTableCell>{user.mobile || 'N/A'}</StyledTableCell>
                    <StyledTableCell>{getUserType(user)}</StyledTableCell>
                    <StyledTableCell>
                      <UserStatusChip 
                        label={getTeamStatus(user) === 'active' ? 'Active' : getTeamStatus(user) === 'blocked' ? 'Blocked' : 'Inactive'} 
                        status={getTeamStatus(user)}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <IconButton
                        aria-label="more"
                        aria-controls="row-menu"
                        aria-haspopup="true"
                        onClick={(event) => handleOpenMenu(event, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
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

      {/* Row Actions Menu */}
      <Menu
        id="row-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        elevation={3}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={() => handleOpenEditDialog(selectedRow)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => handleOpenBlockDialog(selectedRow)}>
          <ListItemIcon>
            {selectedRow?.isBlocked ? <ActiveIcon fontSize="small" color="success" /> : <BlockIcon fontSize="small" color="error" />}
          </ListItemIcon>
          <ListItemText primary={selectedRow?.isBlocked ? "Unblock User" : "Block User"} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenDeleteDialog(selectedRow)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Edit User
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {editedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editedUser.firstName}
                  onChange={(e) => handleEditChange('firstName', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editedUser.lastName}
                  onChange={(e) => handleEditChange('lastName', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editedUser.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={editedUser.mobile}
                  onChange={(e) => handleEditChange('mobile', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                  <InputLabel>User Type</InputLabel>
                  <Select
                    value={editedUser.userType}
                    onChange={(e) => handleEditChange('userType', e.target.value)}
                    label="User Type"
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="team_leader">Team Leader</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                  <InputLabel>Team Member Status</InputLabel>
                  <Select
                    value={editedUser.teamMemberStatus}
                    onChange={(e) => handleEditChange('teamMemberStatus', e.target.value)}
                    label="Team Member Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editedUser.address}
                  onChange={(e) => handleEditChange('address', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Aadhar Number"
                  value={editedUser.aadharNo}
                  onChange={(e) => handleEditChange('aadharNo', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={editedUser.dob}
                  onChange={(e) => handleEditChange('dob', e.target.value)}
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseEditDialog} 
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Save Changes
          </Button>
        </DialogActions>
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={newUser.firstName}
                    onChange={(e) => handleCreateChange('firstName', e.target.value)}
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
                  <FormControl fullWidth>
                    <InputLabel>User Type</InputLabel>
                    <Select
                      value={newUser.userType}
                      onChange={(e) => handleCreateChange('userType', e.target.value)}
                      label="User Type"
                      startAdornment={
                        <InputAdornment position="start">
                          <BadgeIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="team_leader">Team Leader</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Team Member Status</InputLabel>
                    <Select
                      value={newUser.teamMemberStatus}
                      onChange={(e) => handleCreateChange('teamMemberStatus', e.target.value)}
                      label="Team Member Status"
                      startAdornment={
                        <InputAdornment position="start">
                          <GroupIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleCreateChange('email', e.target.value)}
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
                    onChange={(e) => handleCreateChange('mobile', e.target.value)}
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
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Aadhar Number"
                    value={newUser.aadharNo}
                    onChange={(e) => handleCreateChange('aadharNo', e.target.value)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the user <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block/Unblock Confirmation Dialog */}
      <Dialog open={openBlockDialog} onClose={handleCloseBlockDialog}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {userToToggleBlock?.isBlocked ? 'Unblock User' : 'Block User'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {userToToggleBlock?.isBlocked
              ? `Are you sure you want to unblock ${userToToggleBlock?.firstName} ${userToToggleBlock?.lastName}?`
              : `Are you sure you want to block ${userToToggleBlock?.firstName} ${userToToggleBlock?.lastName}? This will prevent them from using the system.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseBlockDialog} 
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleToggleBlockUser} 
            variant="contained"
            color={userToToggleBlock?.isBlocked ? "success" : "warning"}
            disabled={actionLoading}
            startIcon={actionLoading ? 
              <CircularProgress size={20} /> : 
              userToToggleBlock?.isBlocked ? <ActiveIcon /> : <BlockIcon />
            }
            sx={{ borderRadius: 2 }}
          >
            {userToToggleBlock?.isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>

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