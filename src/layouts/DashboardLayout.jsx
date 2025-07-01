import { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { styled, alpha, useTheme } from '@mui/material/styles';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Tooltip,
  Button,
  Paper,
  Stack,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalGasStation as PetrolPumpIcon,
  Group as TeamIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  RequestPage as RequestPageIcon,
  UploadFile as UploadFileIcon,
  TableView as TableViewIcon,
  Campaign as CampaignIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  FavoriteBorder as HeartIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { ColorModeContext } from '../App';
import { useSearch } from '../contexts/SearchContext';

const drawerWidth = 260;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
    background: theme.palette.background.default,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div', {
  shouldForwardProp: (prop) => prop !== 'mode',
})(({ theme, mode }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
  background: mode === 'dark' ? '#000000' : 'transparent',
  color: mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 8,
  backgroundColor: alpha(theme.palette.common.black, 0.04),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'mode',
})(({ theme, mode }) => ({
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1, 2),
  color: mode === 'dark' ? '#ffffff' : undefined,
  fontSize: '0.9rem',
  '& .MuiListItemIcon-root': {
    color: mode === 'dark' ? '#ffffff' : undefined,
    minWidth: '40px',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.9rem',
  },
  '&.Mui-selected': {
    backgroundColor: mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.15)' 
      : alpha(theme.palette.primary.main, 0.1),
    color: mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
    '& .MuiListItemIcon-root': {
      color: mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
    },
    '&:hover': {
      backgroundColor: mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.25)' 
        : alpha(theme.palette.primary.main, 0.15),
    },
  },
  '&:hover': {
    backgroundColor: mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : alpha(theme.palette.primary.main, 0.05),
  },
}));

const NestedListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'mode',
})(({ theme, mode }) => ({
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(0.75, 2),
  paddingLeft: theme.spacing(4),
  color: mode === 'dark' ? '#ffffff' : undefined,
  '& .MuiListItemIcon-root': {
    color: mode === 'dark' ? '#ffffff' : undefined,
    minWidth: '32px',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.85rem',
  },
  '&.Mui-selected': {
    backgroundColor: mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.15)' 
      : alpha(theme.palette.primary.main, 0.1),
    color: mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
    '& .MuiListItemIcon-root': {
      color: mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
    },
    '&:hover': {
      backgroundColor: mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.25)' 
        : alpha(theme.palette.primary.main, 0.15),
    },
  },
  '&:hover': {
    backgroundColor: mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : alpha(theme.palette.primary.main, 0.05),
  },
}));

const Footer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'mode',
})(({ theme, mode }) => ({
  padding: theme.spacing(2),
  marginTop: 'auto',
  textAlign: 'center',
  backgroundColor: mode === 'dark' ? '#000000' : theme.palette.background.paper,
  color: mode === 'dark' ? '#ffffff' : theme.palette.text.secondary,
  borderRadius: 0,
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { 
    text: 'Users', 
    icon: <PeopleIcon />, 
    hasSubmenu: true,
    submenu: [
      { text: 'View All', icon: <VisibilityIcon />, path: '/users' },
      { text: 'Create New', icon: <AddIcon />, path: '/users/create' },
      { text: 'Edit', icon: <EditIcon />, path: '/users/edit' },
      { text: 'Delete', icon: <DeleteIcon />, path: '/users/delete' },
    ]
  },
  { 
    text: 'Petrol Pumps', 
    icon: <PetrolPumpIcon />, 
    hasSubmenu: true,
    submenu: [
      { text: 'View All', icon: <VisibilityIcon />, path: '/petrol-pumps/view' },
      { text: 'Create New', icon: <AddIcon />, path: '/petrol-pumps/create' },
      { text: 'Edit', icon: <EditIcon />, path: '/petrol-pumps/edit' },
      { text: 'Delete', icon: <DeleteIcon />, path: '/petrol-pumps/delete' },
    ]
  },
  { 
    text: 'Petrol Pump Requests', 
    icon: <RequestPageIcon />, 
    hasSubmenu: true,
    submenu: [
      { text: 'View All', icon: <VisibilityIcon />, path: '/petrol-pump-requests' },
      // { text: 'Create New', icon: <AddIcon />, path: '/petrol-pump-requests/create' },
      { text: 'Edit', icon: <EditIcon />, path: '/petrol-pump-requests/edit' },
      { text: 'Delete', icon: <DeleteIcon />, path: '/petrol-pump-requests/delete' },
    ]
  },
  { text: 'Excel Import', icon: <UploadFileIcon />, path: '/excel-import' },
  // { text: 'Imported Data', icon: <TableViewIcon />, path: '/imported-data' },
  { 
    text: 'Teams', 
    icon: <TeamIcon />, 
    hasSubmenu: true,
    submenu: [
      { text: 'View All', icon: <VisibilityIcon />, path: '/teams' },
      { text: 'Create New', icon: <AddIcon />, path: '/teams/create' },
      { text: 'Edit', icon: <EditIcon />, path: '/teams/edit' },
      { text: 'Delete', icon: <DeleteIcon />, path: '/teams/delete' },
    ]
  },
  { text: 'Advertisements', icon: <CampaignIcon />, path: '/ads' },
  // { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery, performSearch } = useSearch();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const colorMode = useContext(ColorModeContext);
  const { drawerMode, toggleDrawerMode } = colorMode;
  const theme = useTheme();
  
  // State to track which submenus are open
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleSubmenuToggle = (text) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };
  
  // Check if any submenu item is active
  const isSubmenuActive = (submenuItems) => {
    return submenuItems.some(item => location.pathname === item.path);
  };

  // Search handlers
  const handleSearch = () => {
    console.log('Handle search called with:', localSearchQuery);
    if (localSearchQuery.trim()) {
      console.log('Searching for:', localSearchQuery);
      setSearchQuery(localSearchQuery);
      performSearch(localSearchQuery);
      navigate('/search');
    } else {
      console.log('Empty search query');
    }
  };

  const handleKeyPress = (event) => {
    console.log('Key pressed:', event.key);
    if (event.key === 'Enter') {
      console.log('Enter pressed, triggering search');
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    console.log('Clearing search');
    setLocalSearchQuery('');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search users, teams, petrol pumps, requests..."
              value={localSearchQuery}
              onChange={(e) => {
                console.log('Search input changed:', e.target.value);
                setLocalSearchQuery(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
          <Button
            variant="contained"
            size="small"
            onClick={handleSearch}
            sx={{ minWidth: 'auto', px: 2, ml: 1 }}
          >
            Search
          </Button> */}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={drawerMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton
                onClick={toggleDrawerMode}
                color="inherit"
                sx={{ mr: 1 }}
              >
                {drawerMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* <Tooltip title="Notifications">
              <IconButton
                size="large"
                aria-label="show 4 new notifications"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={4} color="secondary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip> */}
            
            <Tooltip title="Account">
              <IconButton
                onClick={handleMenuClick}
                size="small"
                sx={{ ml: 1 }}
                aria-controls={openMenu ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openMenu ? 'true' : undefined}
              >
                <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>A</Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={openMenu}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 180,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem sx={{ py: 1.5 }}>
                <Avatar /> My Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.15)',
            backgroundColor: drawerMode === 'dark' ? '#000000' : '#ffffff',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader mode={drawerMode}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center',
            color: drawerMode === 'dark' ? '#ffffff' : '#2b2d42'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src="/Branding.png" 
                alt="Company Logo" 
                style={{ 
                  height: '30px', 
                  marginRight: '8px',
                  objectFit: 'contain'
                }} 
              />
              Click
            </Box>
          </Typography>
          <IconButton onClick={handleDrawerClose} sx={{ color: drawerMode === 'dark' ? '#ffffff' : '#2b2d42' }}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        
        <Divider sx={{ mx: 2, opacity: drawerMode === 'dark' ? 0.2 : 0.7 }} />
        
        <List sx={{ px: 1, py: 1 }}>
          {menuItems.map((item) => (
            item.hasSubmenu ? (
              <Box key={item.text}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <StyledListItemButton 
                    mode={drawerMode}
                    selected={isSubmenuActive(item.submenu)}
                    onClick={() => handleSubmenuToggle(item.text)}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontWeight: isSubmenuActive(item.submenu) ? 600 : 500,
                      }} 
                    />
                    {openSubmenus[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </StyledListItemButton>
                </ListItem>
                <Collapse in={openSubmenus[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem) => (
                      <ListItem key={subItem.text} disablePadding sx={{ mb: 0.5 }}>
                        <NestedListItemButton
                          mode={drawerMode}
                          selected={location.pathname === subItem.path}
                          onClick={() => navigate(subItem.path)}
                        >
                          <ListItemIcon>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.text} 
                            primaryTypographyProps={{ 
                              fontWeight: location.pathname === subItem.path ? 600 : 500,
                            }} 
                          />
                        </NestedListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ) : (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <StyledListItemButton 
                  mode={drawerMode}
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }} 
                  />
                </StyledListItemButton>
              </ListItem>
            )
          ))}
        </List>
      </Drawer>
      
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
        <Footer elevation={0} mode={drawerMode}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <Typography variant="body2">
              Crafted with
            </Typography>
            <HeartIcon fontSize="small" color="error" />
            <Typography variant="body2">
              by <strong>MayDIV Infotech</strong>
            </Typography>
          </Stack>
          <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
            &copy; {new Date().getFullYear()} All Rights Reserved
          </Typography>
        </Footer>
      </Main>
    </Box>
  );
} 