import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useMemo } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import RequestPageIcon from '@mui/icons-material/RequestPage';

// Contexts
import { SearchProvider } from './contexts/SearchContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UsersCreate from './pages/UsersCreate';
import UsersEdit from './pages/UsersEdit';
import UsersDelete from './pages/UsersDelete';
import PetrolPumps from './pages/PetrolPumps';
import PetrolPumpsView from './pages/PetrolPumpsView';
import PetrolPumpsCreate from './pages/PetrolPumpsCreate';
import PetrolPumpsEdit from './pages/PetrolPumpsEdit';
import PetrolPumpsDelete from './pages/PetrolPumpsDelete';
import PetrolPumpRequests from './pages/PetrolPumpRequests';
import PetrolPumpRequestsEdit from './pages/PetrolPumpRequestsEdit';
import PetrolPumpRequestsDelete from './pages/PetrolPumpRequestsDelete';
import PetrolPumpRequestsCreate from './pages/PetrolPumpRequestsCreate';
import ExcelImport from './pages/ExcelImport';
import ImportedData from './pages/ImportedData';
import Teams from './pages/Teams';
import TeamsCreate from './pages/TeamsCreate';
import TeamsEdit from './pages/TeamsEdit';
import TeamsDelete from './pages/TeamsDelete';
import Settings from './pages/Settings';
import Ads from './pages/Ads';
import SearchResults from './pages/SearchResults';

// Create Theme Context
export const ColorModeContext = createContext({ 
  toggleDrawerMode: () => {},
  drawerMode: 'light'
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3a86ff',
      light: '#5e9bff',
      dark: '#2c6bcb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff006e',
      light: '#ff4b94',
      dark: '#c1004e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2b2d42',
      secondary: '#6c757d',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState(() => {
    // Get saved drawer mode from localStorage or default to 'light'
    const savedMode = localStorage.getItem('drawerMode');
    return savedMode || 'light';
  });

  const colorMode = useMemo(
    () => ({
      toggleDrawerMode: () => {
        setDrawerMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('drawerMode', newMode);
          return newMode;
        });
      },
      drawerMode,
    }),
    [drawerMode],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <SearchProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              
              {/* Protected Routes */}
              <Route path="/" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="users/create" element={<UsersCreate />} />
                <Route path="users/edit" element={<UsersEdit />} />
                <Route path="users/delete" element={<UsersDelete />} />
                <Route path="petrol-pumps" element={<PetrolPumps />} />
                <Route path="petrol-pumps/create" element={<PetrolPumpsCreate />} />
                <Route path="petrol-pumps/edit" element={<PetrolPumpsEdit />} />
                <Route path="petrol-pumps/delete" element={<PetrolPumpsDelete />} />
                <Route path="petrol-pumps/view" element={<PetrolPumpsView />} />
                <Route path="petrol-pump-requests" element={<PetrolPumpRequests />} />
                <Route path="petrol-pump-requests/edit" element={<PetrolPumpRequestsEdit />} />
                <Route path="petrol-pump-requests/delete" element={<PetrolPumpRequestsDelete />} />
                <Route path="petrol-pump-requests/create" element={<PetrolPumpRequestsCreate />} />
                <Route path="excel-import" element={<ExcelImport />} />
                <Route path="imported-data" element={<ImportedData />} />
                <Route path="teams" element={<Teams />} />
                <Route path="teams/create" element={<TeamsCreate />} />
                <Route path="teams/edit" element={<TeamsEdit />} />
                <Route path="teams/delete" element={<TeamsDelete />} />
                <Route path="settings" element={<Settings />} />
                <Route path="ads" element={<Ads />} />
                <Route path="search" element={<SearchResults />} />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </SearchProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
