import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Fab
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  overflow: 'hidden'
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

const StatBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.background.default, 0.7),
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1)
  }
}));

export default function TeamsCreate() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  const steps = ['Basic Information', 'Team Leader', 'Team Statistics'];
  
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
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newTeam.teamName?.trim()) {
      errors.teamName = 'Team name is required';
    }
    
    if (!newTeam.teamCode?.trim()) {
      errors.teamCode = 'Team code is required';
    }
    
    if (!newTeam.ownerId?.trim()) {
      errors.ownerId = 'Owner ID is required';
    }
    
    if (newTeam.activeMembers < 0) {
      errors.activeMembers = 'Active members cannot be negative';
    }
    
    if (newTeam.memberCount < 0) {
      errors.memberCount = 'Member count cannot be negative';
    }
    
    if (newTeam.pendingRequests < 0) {
      errors.pendingRequests = 'Pending requests cannot be negative';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors below');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const teamsRef = collection(db, 'teams');
      const docRef = await addDoc(teamsRef, newTeam);
      
      setSuccess(`Team "${newTeam.teamName}" created successfully!`);
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
      setActiveStep(0);
    } catch (error) {
      console.error('Error creating team:', error);
      setError(`Error creating team: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleCreateTeam();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
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
    setFieldErrors({});
    setError('');
    setSuccess('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Create New Team
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <StyledCard>
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 2 }}>
            {activeStep === 0 && (
              <Grid container spacing={3} direction="column">
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Basic Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Team Name"
                    value={newTeam.teamName}
                    onChange={(e) => handleCreateChange('teamName', e.target.value)}
                    required
                    error={!!fieldErrors.teamName}
                    helperText={fieldErrors.teamName}
                    placeholder="Enter team name"
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
                    required
                    error={!!fieldErrors.teamCode}
                    helperText={fieldErrors.teamCode}
                    placeholder="Enter team code"
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
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3} direction="column">
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Team Leader
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Owner ID"
                    value={newTeam.ownerId}
                    onChange={(e) => handleCreateChange('ownerId', e.target.value)}
                    required
                    error={!!fieldErrors.ownerId}
                    helperText={fieldErrors.ownerId || "Enter the user ID of the team owner"}
                    placeholder="Enter owner user ID"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3} direction="column">
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Team Statistics
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Active Members"
                    value={newTeam.activeMembers}
                    onChange={(e) => handleCreateChange('activeMembers', parseInt(e.target.value) || 0)}
                    error={!!fieldErrors.activeMembers}
                    helperText={fieldErrors.activeMembers}
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
                    onChange={(e) => handleCreateChange('memberCount', parseInt(e.target.value) || 0)}
                    error={!!fieldErrors.memberCount}
                    helperText={fieldErrors.memberCount}
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
                    onChange={(e) => handleCreateChange('pendingRequests', parseInt(e.target.value) || 0)}
                    error={!!fieldErrors.pendingRequests}
                    helperText={fieldErrors.pendingRequests}
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
            )}
          </Box>
        </CardContent>
      </StyledCard>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
          startIcon={<CancelIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Back
        </Button>
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleCreateTeam} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Create Team
          </Button>
        )}
      </Box>

      {success && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button onClick={handleReset} variant="outlined">
            Create Another Team
          </Button>
        </Box>
      )}
    </Box>
  );
} 