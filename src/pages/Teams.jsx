import { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  AvatarGroup,
  Divider,
  MenuItem,
  Alert,
  Fab,
  Tabs,
  Tab,
  Menu,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Stack
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Group as TeamIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  DirectionsCar as CarIcon,
  LocalGasStation as FuelIcon,
  Speed as SpeedIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as CopyIcon,
  Group as GroupIcon,
  Code as CodeIcon,
  Numbers as NumbersIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, doc, deleteDoc, orderBy, getDoc, updateDoc, addDoc } from 'firebase/firestore';

// Styled components
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

const TeamCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.12)'
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.dark,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
}));

const StatBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.background.default, 0.7),
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1)
  }
}));

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    teamCode: '',
    ownerId: '',
    activeMembers: 0,
    memberCount: 0,
    pendingRequests: 0,
    teamStats: {
      totalUploads: 0,
      totalDistance: 0,
      totalVisits: 0,
      fuelConsumption: 0
    },
    createdAt: new Date(),
    isDummy: false
  });
  const [error, setError] = useState('');

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        console.log('Fetching teams...');
        const teamsRef = collection(db, 'teams');
        const q = query(teamsRef);
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`Found ${querySnapshot.size} teams`);
          const teamsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Team data:', doc.id, data);
            return {
              id: doc.id,
              ...data
            };
          }).filter(team => !team.isDummy); // Filter out dummy teams
          
          setTeams(teamsData);
          setFilteredTeams(teamsData);
        } else {
          console.log('No teams found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  // Filter teams based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team => 
        (team.teamName && team.teamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (team.id && team.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTeams(filtered);
    }
  }, [searchTerm, teams]);

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

  // Delete team handlers
  const handleOpenDeleteDialog = (team) => {
    setTeamToDelete(team);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setTeamToDelete(null);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setActionLoading(true);
    try {
      const teamRef = doc(db, 'teams', teamToDelete.id);
      await deleteDoc(teamRef);
      
      // Remove from state
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamToDelete.id));
      setFilteredTeams(prevTeams => prevTeams.filter(team => team.id !== teamToDelete.id));
      
      setActionLoading(false);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting team:', error);
      setActionLoading(false);
    }
  };

  // View team details handlers
  const handleOpenDetailsDialog = async (team) => {
    setSelectedTeam(team);
    setOpenDetailsDialog(true);
    
    try {
      // Fetch team members
      const members = [];
      if (team.members && team.members.length > 0) {
        for (const memberId of team.members) {
          const userRef = doc(db, 'users', memberId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            members.push({
              id: userSnap.id,
              ...userSnap.data()
            });
          } else {
            members.push({ id: memberId, name: 'Unknown User' });
          }
        }
      }
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedTeam(null);
    setTeamMembers([]);
  };

  // Create team handlers
  const handleOpenCreateDialog = () => {
    setNewTeam({
      teamName: '',
      teamCode: '',
      ownerId: '',
      activeMembers: 0,
      memberCount: 0,
      pendingRequests: 0,
      teamStats: {
        totalUploads: 0,
        totalDistance: 0,
        totalVisits: 0,
        fuelConsumption: 0
      },
      createdAt: new Date(),
      isDummy: false
    });
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleCreateChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewTeam(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewTeam(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCreateTeam = async () => {
    setActionLoading(true);
    try {
      const teamsRef = collection(db, 'teams');
      const docRef = await addDoc(teamsRef, newTeam);
      
      // Add the new team to the local state
      const createdTeam = {
        id: docRef.id,
        ...newTeam
      };
      
      setTeams(prevTeams => [...prevTeams, createdTeam]);
      
      setActionLoading(false);
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error creating team:', error);
      setError(error.message);
      setActionLoading(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Team Management
        </Typography>
        <Fab
          color="primary"
          size="medium"
          onClick={handleOpenCreateDialog}
          sx={{ ml: 2 }}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search teams by name or ID"
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
      
      {/* Teams Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Team ID</TableCell>
                <TableCell>Team Name</TableCell>
                <TableCell>Active Members</TableCell>
                <TableCell>Pending Requests</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((team) => (
                    <TableRow hover key={team.id}>
                      <TableCell>{team.id}</TableCell>
                      <TableCell>{team.teamName || 'Unnamed Team'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${team.activeMembers || 0} members`}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${team.pendingRequests || 0} requests`}
                          color={team.pendingRequests > 0 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {team.createdAt ? new Date(team.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary" onClick={() => handleOpenDetailsDialog(team)}>
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(team)}>
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
          count={filteredTeams.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Delete Team Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the team{' '}
          {teamToDelete ? `"${teamToDelete.teamName || teamToDelete.id}"` : ''}? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTeam} 
            color="error" 
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Team Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedTeam && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TeamIcon sx={{ fontSize: 28, mr: 1 }} />
                {selectedTeam.teamName || `Team ${selectedTeam.id}`}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Team Details</Typography>
                  
                  <Typography variant="subtitle2">Team ID:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTeam.id}
                  </Typography>
                  
                  <Typography variant="subtitle2">Active Members:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTeam.activeMembers || 0} members
                  </Typography>
                  
                  <Typography variant="subtitle2">Pending Requests:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTeam.pendingRequests || 0} requests
                  </Typography>
                  
                  <Typography variant="subtitle2">Created At:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTeam.createdAt ? new Date(selectedTeam.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Team Statistics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <UploadIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {selectedTeam.teamStats?.totalUploads || 0}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Uploads
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <SpeedIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {selectedTeam.teamStats?.totalDistance || 0} km
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Distance
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CarIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {selectedTeam.teamStats?.totalVisits || 0}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Visits
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FuelIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {selectedTeam.teamStats?.totalFuelConsumption || 0} L
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Fuel Consumption
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailsDialog}>Close</Button>
              <Button 
                color="error"
                onClick={() => {
                  handleCloseDetailsDialog();
                  handleOpenDeleteDialog(selectedTeam);
                }}
              >
                Delete Team
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Team Dialog */}
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
            <GroupIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Create New Team
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Team Name"
                value={newTeam.teamName}
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
              <TextField
                fullWidth
                label="Team Code"
                value={newTeam.teamCode}
                onChange={(e) => handleCreateChange('teamCode', e.target.value)}
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
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Team Leader
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Owner ID"
                value={newTeam.ownerId}
                onChange={(e) => handleCreateChange('ownerId', e.target.value)}
                variant="outlined"
                helperText="Enter the user ID of the team owner"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NumbersIcon color="primary" />
                Team Statistics
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Active Members"
                value={newTeam.activeMembers}
                onChange={(e) => handleCreateChange('activeMembers', parseInt(e.target.value))}
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
                value={newTeam.memberCount}
                onChange={(e) => handleCreateChange('memberCount', parseInt(e.target.value))}
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
                value={newTeam.pendingRequests}
                onChange={(e) => handleCreateChange('pendingRequests', parseInt(e.target.value))}
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
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseCreateDialog} 
            variant="outlined"
            color="inherit"
            startIcon={<CancelIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTeam} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 