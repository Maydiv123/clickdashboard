import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress
} from '@mui/material';
import { 
  PeopleOutline as PeopleIcon, 
  LocalGasStationOutlined as PetrolPumpIcon,
  GroupsOutlined as TeamIcon,
  CameraAltOutlined as PhotoIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    userCount: 0,
    petrolPumpCount: 0,
    teamCount: 0,
    photoCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user count
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const userCount = usersSnapshot.size;
        
        // Fetch recent users
        const recentUsersQuery = query(usersRef, orderBy('createdAt', 'desc'), limit(5));
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsersData = recentUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Recent Users Data:', recentUsersData);
        
        // Fetch petrol pump count
        const petrolPumpsRef = collection(db, 'petrolPumps');
        const petrolPumpsSnapshot = await getDocs(petrolPumpsRef);
        const petrolPumpCount = petrolPumpsSnapshot.size;
        
        // Log petrol pumps data
        const petrolPumpsData = petrolPumpsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Petrol Pumps Data:', petrolPumpsData);
        
        // Fetch team count
        const teamsRef = collection(db, 'teams');
        const teamsSnapshot = await getDocs(teamsRef);
        const teamCount = teamsSnapshot.size;
        
        // Fetch teams data for chart
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Teams Data:', teamsData);
        
        // Transform teams data for chart
        const chartTeamData = teamsData.map(team => ({
          name: team.name || 'Unnamed Team',
          members: team.members?.length || 0,
        }));
        
        // Fetch photos count
        const photosRef = collection(db, 'photos');
        const photosSnapshot = await getDocs(photosRef);
        const photoCount = photosSnapshot.size;
        
        // Log photos data
        const photosData = photosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Photos Data:', photosData);
        
        // Update state
        setStats({
          userCount,
          petrolPumpCount,
          teamCount,
          photoCount
        });
        
        setRecentUsers(recentUsersData);
        setTeamData(chartTeamData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Dummy data for charts in case the real data isn't available
  const dummyTeamData = [
    { name: 'Team A', members: 4 },
    { name: 'Team B', members: 3 },
    { name: 'Team C', members: 2 },
    { name: 'Team D', members: 5 },
    { name: 'Team E', members: 1 },
  ];
  
  const activityData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 3 },
    { name: 'Wed', count: 2 },
    { name: 'Thu', count: 7 },
    { name: 'Fri', count: 5 },
    { name: 'Sat', count: 9 },
    { name: 'Sun', count: 6 },
  ];

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
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: COLORS[0], mr: 2 }} />
                <Typography variant="h5" component="div">
                  Users
                </Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.userCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PetrolPumpIcon sx={{ fontSize: 40, color: COLORS[1], mr: 2 }} />
                <Typography variant="h5" component="div">
                  Pumps
                </Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.petrolPumpCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TeamIcon sx={{ fontSize: 40, color: COLORS[2], mr: 2 }} />
                <Typography variant="h5" component="div">
                  Teams
                </Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.teamCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PhotoIcon sx={{ fontSize: 40, color: COLORS[3], mr: 2 }} />
                <Typography variant="h5" component="div">
                  Photos
                </Typography>
              </Box>
              <Typography variant="h3" component="div">
                {stats.photoCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Team Members Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Team Members Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={teamData.length > 0 ? teamData : dummyTeamData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="members"
                >
                  {(teamData.length > 0 ? teamData : dummyTeamData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Weekly Activity Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Activity
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={activityData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Recent Users */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Users
            </Typography>
            <Box>
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <Box key={user.id} sx={{ display: 'flex', py: 1, borderBottom: '1px solid #eee' }}>
                    <Box sx={{ mr: 2 }}>
                      <Typography variant="body1">{user.name || user.email || 'Unknown User'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2">No recent users found.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 