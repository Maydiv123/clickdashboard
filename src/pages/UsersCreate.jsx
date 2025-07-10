import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  Divider,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { 
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Badge as BadgeIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  CalendarToday as CalendarTodayIcon,
  ContactPhone as ContactPhoneIcon,
  QrCode as QrCodeIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Info as InfoIcon,
  CreditCard as CreditCardIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const companyOptions = ['HPCL', 'BPCL', 'IOCL'];

const steps = ['Basic Information', 'Contact Details', 'Additional Information'];

export default function UsersCreate() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [openCreateDialog, setOpenCreateDialog] = useState(true);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    userType: 'user',
    teamMemberStatus: 'inactive',
    address: '',
    aadharNo: '',
    dob: '',
    preferredCompanies: ['HPCL'],
    teamCode: '',
    teamName: '',
    isTeamOwner: false,
    profileCompletion: 0,
    password: '',
    userId: '',
    isBlocked: false,
    createdAt: new Date(),
    isDummy: false
  });

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreateChange = (field, value) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
    clearFieldErrors(field);
  };

  const clearFieldErrors = (field) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateCurrentStep = () => {
    const errors = {};

    switch (activeStep) {
      case 0: // Basic Information
        if (!newUser.firstName.trim()) errors.firstName = 'First name is required';
        if (!newUser.lastName.trim()) errors.lastName = 'Last name is required';
        if (!newUser.userType) errors.userType = 'User type is required';
        if (newUser.dob) {
          const age = calculateAge(newUser.dob);
          if (age < 18) {
            errors.dob = 'User must be at least 18 years old';
          }
        }
        break;
      
      case 1: // Contact Details
        if (!newUser.mobile.trim()) errors.mobile = 'Mobile number is required';
        else if (!/^\d{10}$/.test(newUser.mobile)) errors.mobile = 'Mobile number must be 10 digits';
        if (!newUser.email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(newUser.email)) errors.email = 'Invalid email format';
        if (!newUser.password.trim()) errors.password = 'Password is required';
        else if (newUser.password.length !== 6 || !/^\d+$/.test(newUser.password)) {
          errors.password = 'Password must be exactly 6 digits';
        }
        break;
      
      case 2: // Additional Information
        if (newUser.aadharNo && !/^\d{12}$/.test(newUser.aadharNo)) {
          errors.aadharNo = 'Aadhar number must be 12 digits';
        }
        if (!newUser.preferredCompanies || newUser.preferredCompanies.length === 0) {
          errors.preferredCompanies = 'At least one preferred company is required';
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate profile completion
      const completion = calculateProfileCompletion();
      
      const userData = {
        ...newUser,
        profileCompletion: completion,
        createdAt: new Date(),
        userId: newUser.email // Using email as userId for now
      };

      await addDoc(collection(db, 'user_data'), userData);
      
      setSuccess(true);
      setNewUser({
        firstName: '',
        lastName: '',
        mobile: '',
        email: '',
        userType: 'user',
        teamMemberStatus: 'inactive',
        address: '',
        aadharNo: '',
        dob: '',
        preferredCompanies: ['HPCL'],
        teamCode: '',
        teamName: '',
        isTeamOwner: false,
        profileCompletion: 0,
        password: '',
        userId: '',
        isBlocked: false,
        createdAt: new Date(),
        isDummy: false
      });
      setActiveStep(0);
      setOpenCreateDialog(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    let completion = 0;
    const fields = [
      'firstName', 'lastName', 'mobile', 'email', 'address', 
      'aadharNo', 'dob', 'preferredCompanies', 'teamCode', 'teamName'
    ];
    
    fields.forEach(field => {
      if (newUser[field]) {
        if (Array.isArray(newUser[field])) {
          if (newUser[field].length > 0) completion += 100 / fields.length;
        } else if (typeof newUser[field] === 'string' && newUser[field].trim() !== '') {
          completion += 100 / fields.length;
        }
      }
    });
    
    return Math.round(completion);
  };

  const handleMobileChange = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      handleCreateChange('mobile', numericValue);
      if (numericValue.length === 10) {
        clearFieldErrors('mobile');
      }
    }
  };

  const handlePasswordChange = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      handleCreateChange('password', numericValue);
      if (numericValue.length === 6) {
        clearFieldErrors('password');
      }
    }
  };

  const handleAadharChange = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 12) {
      handleCreateChange('aadharNo', numericValue);
      if (numericValue.length === 12) {
        clearFieldErrors('aadharNo');
      }
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Create New User
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          User created successfully!
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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
              <Box>
                {/* Basic Information Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Basic Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={newUser.firstName}
                        onChange={(e) => handleCreateChange('firstName', e.target.value)}
                        required
                        error={!!fieldErrors.firstName}
                        helperText={fieldErrors.firstName}
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
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={newUser.lastName}
                        onChange={(e) => handleCreateChange('lastName', e.target.value)}
                        required
                        error={!!fieldErrors.lastName}
                        helperText={fieldErrors.lastName}
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
                    <Grid item xs={12} sm={6} sx={{ width: '150px' }}>
                      <FormControl fullWidth error={!!fieldErrors.userType}>
                        <InputLabel>User Type</InputLabel>
                        <Select
                          value={newUser.userType}
                          onChange={(e) => handleCreateChange('userType', e.target.value)}
                          label="User Type"
                          startAdornment={
                            <InputAdornment position="start">
                              <BadgeIcon color="action" />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="user">User</MenuItem>
                          <MenuItem value="Team Leader">Team Leader</MenuItem>
                          <MenuItem value="teamOwner">Team Owner</MenuItem>
                        </Select>
                        {fieldErrors.userType && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {fieldErrors.userType}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={newUser.dob}
                        onChange={(e) => handleCreateChange('dob', e.target.value)}
                        variant="outlined"
                        error={!!fieldErrors.dob}
                        helperText={fieldErrors.dob}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          max: (() => {
                            const today = new Date();
                            const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                            return maxDate.toISOString().split('T')[0];
                          })()
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarTodayIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                {/* Contact Information Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ContactPhoneIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Contact Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Mobile Number"
                        value={newUser.mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        required
                        error={!!fieldErrors.mobile}
                        helperText={fieldErrors.mobile}
                        placeholder="Enter exactly 10 digits"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => handleCreateChange('email', e.target.value)}
                        required
                        error={!!fieldErrors.email}
                        helperText={fieldErrors.email}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="MPIN"
                        type={showPassword ? 'text' : 'password'}
                        value={newUser.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        error={!!fieldErrors.password}
                        helperText={fieldErrors.password}
                        placeholder="Enter exactly 6 digits"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Aadhar Number"
                        value={newUser.aadharNo}
                        onChange={(e) => handleAadharChange(e.target.value)}
                        error={!!fieldErrors.aadharNo}
                        helperText={fieldErrors.aadharNo}
                        placeholder="Enter exactly 12 digits (optional)"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CreditCardIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ width: '560px' }}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={newUser.address}
                        onChange={(e) => handleCreateChange('address', e.target.value)}
                        multiline
                        rows={3}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                {/* Team Information Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <GroupIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Team Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Team Code"
                        value={newUser.teamCode}
                        onChange={(e) => handleCreateChange('teamCode', e.target.value)}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <QrCodeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Team Name"
                        value={newUser.teamName}
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
                    <Grid item xs={12} sm={6} sx={{ width: '150px' }}>
                      <FormControl fullWidth>
                        <InputLabel>Is Team Owner</InputLabel>
                        <Select
                          value={newUser.isTeamOwner ? 'true' : 'false'}
                          onChange={(e) => handleCreateChange('isTeamOwner', e.target.value === 'true')}
                          label="Is Team Owner"
                          startAdornment={
                            <InputAdornment position="start">
                              <AdminPanelSettingsIcon color="action" />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="false">No</MenuItem>
                          <MenuItem value="true">Yes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                {/* Additional Information Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InfoIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Additional Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" required error={!!fieldErrors.preferredCompanies}>
                        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon color="action" fontSize="small" />
                          Preferred Companies
                        </Typography>
                        <FormGroup row>
                          {companyOptions.map((company) => (
                            <FormControlLabel
                              key={company}
                              control={
                                <Checkbox
                                  checked={newUser.preferredCompanies.includes(company)}
                                  onChange={(e) => {
                                    let updated = [...newUser.preferredCompanies];
                                    if (e.target.checked) {
                                      updated.push(company);
                                    } else {
                                      if (updated.length === 1) return; // Prevent removing last
                                      updated = updated.filter((c) => c !== company);
                                    }
                                    setNewUser((prev) => ({ ...prev, preferredCompanies: updated }));
                                    clearFieldErrors('preferredCompanies');
                                  }}
                                  name={company}
                                />
                              }
                              label={company}
                            />
                          ))}
                        </FormGroup>
                        {fieldErrors.preferredCompanies && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            {fieldErrors.preferredCompanies}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button 
          onClick={() => window.history.back()} 
          variant="outlined"
          color="inherit"
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            py: 1,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Back to Users
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              variant="outlined"
              sx={{ 
                borderRadius: 2, 
                px: 3, 
                py: 1,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{ 
                borderRadius: 2, 
                px: 3, 
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleCreateUser} 
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{ 
                borderRadius: 2, 
                px: 3, 
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(58, 134, 255, 0.2)'
              }}
            >
              Create User
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
} 