import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Paper,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  LocalGasStation as PetrolPumpIcon,
  RequestPage as RequestPageIcon,
  Person as PersonIcon,
  Group as TeamIcon
} from '@mui/icons-material';
import { useSearch } from '../contexts/SearchContext';

const SearchResults = () => {
  const navigate = useNavigate();
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching, 
    searchPerformed, 
    performSearch, 
    clearSearch 
  } = useSearch();
  
  const [activeTab, setActiveTab] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearch = () => {
    setSearchQuery(localSearchQuery);
    performSearch(localSearchQuery);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    clearSearch();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user':
        return <PersonIcon />;
      case 'team':
        return <TeamIcon />;
      case 'petrol_pump':
        return <PetrolPumpIcon />;
      case 'request':
        return <RequestPageIcon />;
      default:
        return <SearchIcon />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'user':
        return 'primary';
      case 'team':
        return 'secondary';
      case 'petrol_pump':
        return 'success';
      case 'request':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'user':
        return 'User';
      case 'team':
        return 'Team';
      case 'petrol_pump':
        return 'Petrol Pump';
      case 'request':
        return 'Request';
      default:
        return 'Unknown';
    }
  };

  const getNavigationPath = (item) => {
    switch (item.type) {
      case 'user':
        return `/users`;
      case 'team':
        return `/teams`;
      case 'petrol_pump':
        return `/petrol-pumps`;
      case 'request':
        return `/petrol-pump-requests`;
      default:
        return '/';
    }
  };

  const filteredResults = activeTab === 0 
    ? searchResults 
    : searchResults.filter(result => {
        const typeMap = { 1: 'user', 2: 'team', 3: 'petrol_pump', 4: 'request' };
        return result.type === typeMap[activeTab];
      });

  const tabLabels = ['All', 'Users', 'Teams', 'Petrol Pumps', 'Requests'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Search Results
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search users, teams, petrol pumps, requests..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: localSearchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isSearching}
            startIcon={isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Results Section */}
      {searchPerformed && (
        <Box>
          {/* Results Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {isSearching ? 'Searching...' : `${filteredResults.length} results found`}
            </Typography>
            {searchResults.length > 0 && (
              <Chip 
                label={`"${searchQuery}"`} 
                color="primary" 
                variant="outlined"
                onDelete={clearSearch}
              />
            )}
          </Box>

          {/* Tabs */}
          {searchResults.length > 0 && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                {tabLabels.map((label, index) => (
                  <Tab 
                    key={label} 
                    label={`${label} (${index === 0 ? searchResults.length : searchResults.filter(r => {
                      const typeMap = { 1: 'user', 2: 'team', 3: 'petrol_pump', 4: 'request' };
                      return r.type === typeMap[index];
                    }).length})`} 
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Results List */}
          {isSearching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredResults.length === 0 ? (
            <Alert severity="info">
              {searchPerformed 
                ? `No results found for "${searchQuery}". Try different keywords.`
                : 'Enter a search query to find users, teams, petrol pumps, or requests.'
              }
            </Alert>
          ) : (
            <List>
              {filteredResults.map((item, index) => (
                <Box key={`${item.type}-${item.id}`}>
                  <ListItem 
                    sx={{ 
                      px: 0,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemButton
                      onClick={() => navigate(getNavigationPath(item))}
                      sx={{ borderRadius: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getTypeColor(item.type)}.main` }}>
                          {getTypeIcon(item.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {item.displayName}
                            </Typography>
                            <Chip 
                              label={getTypeLabel(item.type)} 
                              size="small" 
                              color={getTypeColor(item.type)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                            {item.email && (
                              <Typography variant="caption" color="text.secondary">
                                {item.email}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Stack>
                    </ListItemButton>
                  </ListItem>
                  {index < filteredResults.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Initial State */}
      {!searchPerformed && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Global Search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search across all users, teams, petrol pumps, and requests in the system.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchResults; 