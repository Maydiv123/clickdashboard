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
    borderRadius: 2,
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
    minHeight: 80,
  }}>
    <CardContent sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2,
          borderRadius: 1.5,
          bgcolor: `${color}15`,
          color: color,
          minWidth: 56,
          height: 56,
          mr: 3,
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" component="div" sx={{ mb: 0.5, fontWeight: 'bold', fontSize: '2rem' }}>
            {value}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 1.5, 
            py: 0.5, 
            borderRadius: 1, 
            bgcolor: '#e6f7ea', 
            color: '#2e7d32',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            ml: 2,
          }}>
            <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
            {trend}
          </Box>
        )}
      </Box>
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
  const [growthData, setGrowthData] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user count
        const usersRef = collection(db, 'user_data');
        const usersSnapshot = await getDocs(usersRef);
        const userCount = usersSnapshot.size;
        
        // Fetch recent users
        const recentUsersQuery = query(usersRef, orderBy('createdAt', 'desc'), limit(5));
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsersData = recentUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // console.log("recentUsersData",recentUsersData);
        
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
          name: team.teamName || 'Unnamed Team',
          members: team.members?.length || 0,
        }));
        
        // Fetch photos count
        const photosRef = collection(db, 'photos');
        const photosSnapshot = await getDocs(photosRef);
        const photoCount = photosSnapshot.size;
        
        // Get all users for growth calculation
        const allUsersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get all petrol pumps data for growth calculation
        const allPetrolPumpsData = petrolPumpsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Generate growth data based on real user creation dates
        const growthData = [];
        const currentDate = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthName = monthDate.toLocaleString('default', { month: 'short' });
          
          // Count users created in this month from all users
          const monthUsers = allUsersData.filter(user => {
            const userDate = user.createdAt?.toDate?.() || new Date(user.createdAt);
            return userDate.getMonth() === monthDate.getMonth() && 
                   userDate.getFullYear() === monthDate.getFullYear();
          }).length;
          
          // Count petrol pumps imported in this month from real data
          const monthPumps = allPetrolPumpsData.filter(pump => {
            const pumpDate = pump.importedAt?.toDate?.() || new Date(pump.importedAt);
            return pumpDate.getMonth() === monthDate.getMonth() && 
                   pumpDate.getFullYear() === monthDate.getFullYear();
          }).length;
          
          growthData.push({
            name: monthName,
            users: monthUsers,
            pumps: monthPumps,
          });
        }
        
        // Generate weekly activity data based on real data
        const now = new Date();
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = weekDays.map((day, index) => {
          const dayDate = new Date(now);
          dayDate.setDate(now.getDate() - (now.getDay() - index));
          
          // Filter users created on this day from all users
          const dayUsers = allUsersData.filter(user => {
            const userDate = user.createdAt?.toDate?.() || new Date(user.createdAt);
            return userDate.toDateString() === dayDate.toDateString();
          });
          
          // Filter petrol pumps imported on this day
          const dayPumps = allPetrolPumpsData.filter(pump => {
            const pumpDate = pump.importedAt?.toDate?.() || new Date(pump.importedAt);
            return pumpDate.toDateString() === dayDate.toDateString();
          });
          
          return {
            name: day,
            users: dayUsers.length,
            pumps: dayPumps.length,
            date: dayDate
          };
        });
        
        // Update state
        setStats({
          userCount,
          petrolPumpCount,
          teamCount,
          photoCount
        });
        
        setRecentUsers(recentUsersData);
        setTeamData(chartTeamData);
        setGrowthData(growthData);
        setWeeklyActivity(weeklyData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
        
        {/* <Button 
          variant="contained" 
          disableElevation
          endIcon={<ArrowForwardIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          View Reports
        </Button> */}
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon sx={{ fontSize: 28 }} />} 
            title="Total Users" 
            value={stats.userCount}
            color={COLORS[0]}
            
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PetrolPumpIcon sx={{ fontSize: 28 }} />} 
            title="Petrol Pumps" 
            value={stats.petrolPumpCount}
            color={COLORS[1]}
          
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<TeamIcon sx={{ fontSize: 28 }} />} 
            title="Total Teams" 
            value={stats.teamCount}
            color={COLORS[2]}
            
          />
        </Grid>
        
        {/* <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PhotoIcon sx={{ fontSize: 28 }} />} 
            title="Total Photos" 
            value={stats.photoCount}
            color={COLORS[3]}
            trend="+15.3%"
          />
        </Grid> */}
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Growth Chart */}
        <Grid item xs={12} md={6}>
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
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={growthData}
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
        <Grid item xs={12} md={6}>
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
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamData}
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
                      {teamData.map((entry, index) => (
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
                              {user.firstName || 'Unknown User'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {user.mobile || 'No email provided'}
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
                  <BarChart data={weeklyActivity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    <Bar 
                      dataKey="users" 
                      fill={COLORS[0]} 
                      radius={[4, 4, 0, 0]} 
                      barSize={25}
                      name="Users"
                    />
                    <Bar 
                      dataKey="pumps" 
                      fill={COLORS[1]} 
                      radius={[4, 4, 0, 0]} 
                      barSize={25}
                      name="Petrol Pumps"
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