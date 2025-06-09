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
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';

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
      const updateData = {
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
        updatedAt: new Date()
      };

      await updateDoc(userRef, updateData);
      
      // Update local state
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === editedUser.id ? { ...user, ...updateData } : user
      ));
      
      setFilteredUsers(prevUsers => prevUsers.map(user => 
        user.id === editedUser.id ? { ...user, ...updateData } : user
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
    if (user.isTeamOwner) return 'Team Owner';
    if (user.userType === 'UserType.teamMember') return 'Team Member';
    if (user.userType === 'UserType.individual') return 'Individual';
    return 'Unknown';
  };

  const getTeamStatus = (user) => {
    if (user.teamMemberStatus === 'active') return 'Active';
    if (user.teamMemberStatus === 'TeamMemberStatus.pending') return 'Pending';
    return 'N/A';
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
      <Typography variant="h4" gutterBottom>
        Users Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by name or email"
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
      
      {/* Users Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>User Type</TableCell>
                <TableCell>Team Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow hover key={user.id}>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.mobile || 'N/A'}</TableCell>
                      <TableCell>{user.teamName || user.teamCode || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getUserType(user)}
                          color={user.isTeamOwner ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTeamStatus(user)}
                          color={user.teamMemberStatus === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.location ? (
                          `${user.location.latitude.toFixed(4)}, ${user.location.longitude.toFixed(4)}`
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(user)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(user)}>
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
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Edit User Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editedUser.firstName}
                  onChange={(e) => handleEditChange('firstName', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editedUser.lastName}
                  onChange={(e) => handleEditChange('lastName', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={editedUser.mobile}
                  onChange={(e) => handleEditChange('mobile', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editedUser.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="User Type"
                  value={editedUser.userType}
                  onChange={(e) => handleEditChange('userType', e.target.value)}
                  margin="normal"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Team Status"
                  value={editedUser.teamMemberStatus}
                  onChange={(e) => handleEditChange('teamMemberStatus', e.target.value)}
                  margin="normal"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editedUser.address}
                  onChange={(e) => handleEditChange('address', e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Aadhar Number"
                  value={editedUser.aadharNo}
                  onChange={(e) => handleEditChange('aadharNo', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={editedUser.dob}
                  onChange={(e) => handleEditChange('dob', e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseEditDialog}
            startIcon={<CancelIcon />}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the user{' '}
          {userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName || ''}` : ''}? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Block/Unblock User Dialog */}
      <Dialog
        open={openBlockDialog}
        onClose={handleCloseBlockDialog}
      >
        <DialogTitle>
          {userToToggleBlock && userToToggleBlock.isBlocked 
            ? 'Unblock User' 
            : 'Block User'}
        </DialogTitle>
        <DialogContent>
          {userToToggleBlock && userToToggleBlock.isBlocked 
            ? `Are you sure you want to unblock ${userToToggleBlock.firstName} ${userToToggleBlock.lastName || ''}?`
            : `Are you sure you want to block ${userToToggleBlock ? (userToToggleBlock.firstName || userToToggleBlock.lastName || '') : ''}? They will not be able to use the application until unblocked.`}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlockDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleToggleBlockUser} 
            color={userToToggleBlock && userToToggleBlock.isBlocked ? "success" : "warning"}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading 
              ? 'Processing...' 
              : (userToToggleBlock && userToToggleBlock.isBlocked ? 'Unblock' : 'Block')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 