import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Button
} from '@mui/material';
import { 
  PeopleOutline as PeopleIcon, 
  LocalGasStationOutlined as PetrolPumpIcon,
  GroupsOutlined as TeamIcon,
  CameraAltOutlined as PhotoIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard = ({ icon, title, value, color, trend }) => (
  <Card sx={{ 
    height: '100%', 
    borderRadius: 3,
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
    },
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 1.5,
          borderRadius: 2,
          bgcolor: `${color}15`,
          color: color,
        }}>
          {icon}
        </Box>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 1, 
            py: 0.5, 
            borderRadius: 1, 
            bgcolor: '#e6f7ea', 
            color: '#2e7d32',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
            {trend}
          </Box>
        )}
      </Box>
      <Typography variant="h3" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </CardContent>
  </Card>
);

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
        
        // Fetch petrol pump count
        const petrolPumpsRef = collection(db, 'petrolPumps');
        const petrolPumpsSnapshot = await getDocs(petrolPumpsRef);
        const petrolPumpCount = petrolPumpsSnapshot.size;
        
        // Fetch team count
        const teamsRef = collection(db, 'teams');
        const teamsSnapshot = await getDocs(teamsRef);
        const teamCount = teamsSnapshot.size;
        
        // Fetch teams data for chart
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Transform teams data for chart
        const chartTeamData = teamsData.map(team => ({
          name: team.name || 'Unnamed Team',
          members: team.members?.length || 0,
        }));
        
        // Fetch photos count
        const photosRef = collection(db, 'photos');
        const photosSnapshot = await getDocs(photosRef);
        const photoCount = photosSnapshot.size;
        
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

  const lineChartData = [
    { name: 'Jan', users: 65, pumps: 28 },
    { name: 'Feb', users: 59, pumps: 48 },
    { name: 'Mar', users: 80, pumps: 40 },
    { name: 'Apr', users: 81, pumps: 47 },
    { name: 'May', users: 56, pumps: 36 },
    { name: 'Jun', users: 55, pumps: 27 },
    { name: 'Jul', users: 40, pumps: 30 },
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', m: 0 }}>
          Dashboard Overview
        </Typography>
        
        <Button 
          variant="contained" 
          disableElevation
          endIcon={<ArrowForwardIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          View Reports
        </Button>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon sx={{ fontSize: 28 }} />} 
            title="Total Users" 
            value={stats.userCount}
            color={COLORS[0]}
            trend="+12.5%"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PetrolPumpIcon sx={{ fontSize: 28 }} />} 
            title="Petrol Pumps" 
            value={stats.petrolPumpCount}
            color={COLORS[1]}
            trend="+5.8%"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<TeamIcon sx={{ fontSize: 28 }} />} 
            title="Total Teams" 
            value={stats.teamCount}
            color={COLORS[2]}
            trend="+7.2%"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PhotoIcon sx={{ fontSize: 28 }} />} 
            title="Total Photos" 
            value={stats.photoCount}
            color={COLORS[3]}
            trend="+14.6%"
          />
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Growth Overview
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke={COLORS[0]} 
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pumps" 
                      stroke={COLORS[1]} 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Team Members Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Team Distribution
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamData.length > 0 ? teamData : dummyTeamData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="members"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {(teamData.length > 0 ? teamData : dummyTeamData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Users
                </Typography>
                <Button 
                  endIcon={<ArrowForwardIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              
              <List sx={{ p: 0 }}>
                {recentUsers.length > 0 ? (
                  recentUsers.map((user, index) => (
                    <Box key={user.id || index}>
                      <ListItem alignItems="center" sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar 
                            src={user.photoURL} 
                            alt={user.name || 'User'}
                            sx={{ bgcolor: COLORS[index % COLORS.length] }}
                          >
                            {(user.name || 'U')[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {user.name || 'Unknown User'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {user.email || 'No email provided'}
                            </Typography>
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {user.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
                        </Typography>
                      </ListItem>
                      {index < recentUsers.length - 1 && <Divider />}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No recent users found
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Weekly Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Weekly Activity
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: 8,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={COLORS[0]} 
                      radius={[4, 4, 0, 0]} 
                      barSize={35}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 