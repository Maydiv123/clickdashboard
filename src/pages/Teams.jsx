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
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon,
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
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

const TeamStatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(status === 'active' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.dark,
    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
  }),
  ...(status === 'inactive' && {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    color: theme.palette.warning.dark,
    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
  }),
  ...(status === 'pending' && {
    backgroundColor: alpha(theme.palette.info.main, 0.1),
    color: theme.palette.info.dark,
    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
  })
}));

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [memberCountFilter, setMemberCountFilter] = useState('all');
  const [createdDateFilter, setCreatedDateFilter] = useState('all');
  const [memberNameFilter, setMemberNameFilter] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [ownerData, setOwnerData] = useState(null);
  const [memberData, setMemberData] = useState([]);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [allTeamMembers, setAllTeamMembers] = useState([]);

  // Fetch all team members for filter dropdown
  const fetchAllTeamMembers = async (teamsData) => {
    try {
      const allMemberIds = new Set();
      
      // Collect all unique member IDs from all teams
      teamsData.forEach(team => {
        if (team.members && team.members.length > 0) {
          team.members.forEach(memberId => allMemberIds.add(memberId));
        }
      });
      
      // Fetch user data for all unique members
      const memberPromises = Array.from(allMemberIds).map(async (memberId) => {
        try {
          const memberDoc = await getDoc(doc(db, 'user_data', memberId));
          if (memberDoc.exists()) {
            return { id: memberId, ...memberDoc.data(), found: true };
          } else {
            return { id: memberId, found: false, name: `User ID: ${memberId}` };
          }
        } catch (error) {
          return { id: memberId, found: false, name: `User ID: ${memberId}` };
        }
      });
      
      const members = await Promise.all(memberPromises);
      setAllTeamMembers(members);
    } catch (error) {
      console.error('Error fetching all team members:', error);
    }
  };

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log('Starting to fetch teams...');
        setLoading(true);
        const teamsRef = collection(db, 'teams');
        const q = query(teamsRef, orderBy('createdAt', 'desc'));
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
          
          // Fetch all unique team members for filter
          await fetchAllTeamMembers(teamsData);
        } else {
          console.log('No teams found');
          setTeams([]);
          setFilteredTeams([]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError(`Error fetching teams: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  // Filter teams based on search term and filters
  useEffect(() => {
    let filtered = [...teams];

    // Search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(team => 
        (team.teamName && team.teamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (team.teamCode && team.teamCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (team.id && team.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Member count filter
    if (memberCountFilter !== 'all') {
      const count = parseInt(memberCountFilter);
      filtered = filtered.filter(team => (team.memberCount || 0) >= count);
    }

    // Member name filter
    if (memberNameFilter !== '') {
      filtered = filtered.filter(team => {
        if (!team.members || team.members.length === 0) return false;
        return team.members.includes(memberNameFilter);
      });
    }

    // Created date filter
    if (createdDateFilter !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(createdDateFilter);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(team => {
        const createdAt = team.createdAt?.toDate ? team.createdAt.toDate() : new Date(team.createdAt);
        return createdAt >= cutoffDate;
      });
    }

    setFilteredTeams(filtered);
  }, [searchTerm, teams, memberCountFilter, memberNameFilter, createdDateFilter]);

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

  // Fetch user data for owner and members
  const fetchUserData = async (team) => {
    if (!team) return;
    
    console.log('Fetching user data for team:', team);
    setLoadingUserData(true);
    try {
      // Fetch owner data
      if (team.ownerId) {
        console.log('Fetching owner with ID:', team.ownerId);
        const ownerDoc = await getDoc(doc(db, 'user_data', team.ownerId));
        if (ownerDoc.exists()) {
          console.log('Owner data found:', ownerDoc.data());
          setOwnerData(ownerDoc.data());
        } else {
          console.log('Owner document does not exist');
        }
      }

      // Fetch member data from the members array
      console.log('Team members array:', team.members);
      if (team.members && team.members.length > 0) {
        console.log('Fetching members with IDs:', team.members);
        const memberPromises = team.members.map(async (memberId) => {
          try {
            const memberDoc = await getDoc(doc(db, 'user_data', memberId));
            if (memberDoc.exists()) {
              return { id: memberId, ...memberDoc.data(), found: true };
            } else {
              return { id: memberId, found: false, error: 'User not found' };
            }
          } catch (error) {
            return { id: memberId, found: false, error: 'Error fetching user' };
          }
        });
        
        const members = await Promise.all(memberPromises);
        console.log('Processed members:', members);
        setMemberData(members);
      } else {
        console.log('No members array or empty members array');
        setMemberData([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  // View team handler
  const handleViewTeam = async (team) => {
    setSelectedTeam(team);
    setViewDialogOpen(true);
    await fetchUserData(team);
  };

  // Close dialog handler
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedTeam(null);
    setOwnerData(null);
    setMemberData([]);
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    let filtered = [...teams];
    if (newValue === 1) {
      filtered = filtered.filter(team => (team.memberCount || 0) >= 10);
    }
    setFilteredTeams(filtered);
  };

  // Filter handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const clearFilters = () => {
    setMemberCountFilter('all');
    setCreatedDateFilter('all');
    setMemberNameFilter('');
  };

  // Utility functions
  const getTeamStatus = (team) => {
    if (team.activeMembers > 0) return 'active';
    if (team.pendingRequests > 0) return 'pending';
    return 'inactive';
  };

  const getInitials = (team) => {
    return team.teamName ? team.teamName.substring(0, 2).toUpperCase() : 'TM';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.toDate()).toLocaleDateString();
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const renderTeamFields = (team) => {
    console.log('Rendering team fields for team:', team);
    console.log('Owner data:', ownerData);
    console.log('Member data:', memberData);
    console.log('Loading user data:', loadingUserData);
    
    return (
      <Grid container spacing={2} sx={{ mt: 1 }} direction="column">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Team Name"
            value={team?.teamName || ''}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Team Code"
            value={team?.teamCode || ''}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Owner ID"
            value={team?.ownerId || ''}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Owner Name"
            value={loadingUserData ? 'Loading...' : (ownerData ? `${ownerData.firstName || ''} ${ownerData.lastName || ''}`.trim() || 'N/A' : 'N/A')}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Member Count"
            value={team?.memberCount || 0}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Created Date"
            value={team?.createdAt ? new Date(team.createdAt.toDate()).toLocaleDateString() : 'N/A'}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        
        {/* Members List */}
        {memberData.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, mt: 2 }}>
              Team Members ({memberData.length})
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              {loadingUserData ? (
                <Typography variant="body2" color="text.secondary">Loading members...</Typography>
              ) : (
                memberData.map((member, index) => (
                  <Box key={member.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: member.found ? 'background.default' : 'error.light'
                  }}>
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: member.found ? 'primary.main' : 'error.main', 
                      fontSize: '0.75rem' 
                    }}>
                      {member.found ? (member.firstName ? member.firstName.charAt(0).toUpperCase() : 'U') : '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      {member.found ? (
                        <>
                          <Typography variant="body2">
                            {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({member.email || 'No email'}) - ID: {member.id}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" color="error.main">
                            User ID: {member.id}
                          </Typography>
                          <Typography variant="caption" color="error.main">
                            {member.error || 'User not available'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    );
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
          Teams
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <SearchField
              placeholder="Search teams..."
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
              {(memberCountFilter !== 'all' || createdDateFilter !== 'all' || memberNameFilter !== '') && (
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
            value={memberCountFilter}
            label="Member Count"
            onChange={(e) => setMemberCountFilter(e.target.value)}
          >
            <MenuItem value="all">All Teams</MenuItem>
            <MenuItem value="1">1+ Members</MenuItem>
            <MenuItem value="5">5+ Members</MenuItem>
            <MenuItem value="10">10+ Members</MenuItem>
            <MenuItem value="20">20+ Members</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Created Date</InputLabel>
          <Select
            value={createdDateFilter}
            label="Created Date"
            onChange={(e) => setCreatedDateFilter(e.target.value)}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Team Member</InputLabel>
          <Select
            value={memberNameFilter}
            label="Team Member"
            onChange={e => setMemberNameFilter(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">All Members</MenuItem>
            {allTeamMembers
              .filter(member => member.found && (member.firstName || member.lastName))
              .map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                </MenuItem>
              ))}
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="team tabs">
            <Tab label={`All Teams (${teams.length})`} />
            <Tab label={`Large Teams (${teams.filter(team => (team.memberCount || 0) >= 10).length})`} />
          </Tabs>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="teams table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Team Name</StyledTableCell>
                <StyledTableCell>Team Code</StyledTableCell>
                <StyledTableCell>Active Members</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {getInitials(team)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {team.teamName || 'Unnamed Team'}
                        </Typography>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>{team.teamCode || 'N/A'}</StyledTableCell>
                    <StyledTableCell>
                      <TeamStatusChip
                        label={`${team.activeMembers || 0} members`}
                        status={getTeamStatus(team)}
                        size="small"
                      />
                    </StyledTableCell>
                    <StyledTableCell>{formatDate(team.createdAt)}</StyledTableCell>
                    <StyledTableCell align="right">
                      <IconButton
                        onClick={() => handleViewTeam(team)}
                        color="primary"
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              {!loading && filteredTeams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No teams found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {searchTerm ? "Try adjusting your search query" : "No teams in this category"}
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
      
      {/* View Team Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedTeam && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>Team Details</Typography>
                <TeamStatusChip
                  label={`${selectedTeam.activeMembers || 0} members`}
                  status={getTeamStatus(selectedTeam)}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {renderTeamFields(selectedTeam)}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>


    </Box>
  );
}