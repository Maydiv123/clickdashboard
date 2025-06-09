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
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  AvatarGroup,
  Divider
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
  Upload as UploadIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, doc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';

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
        Team Management
      </Typography>
      
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
    </Box>
  );
} 