import { useState, useEffect } from 'react';
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
  InputBase,
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
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const companyOptions = ['HPCL', 'BPCL', 'IOCL'];
const professionOptions = [
  'Plumber',
  'Electrician', 
  'Supervisor',
  'Field boy',
  'Officer',
  'Site engineer',
  'Co-worker',
  'Mason',
  'Welder',
  'Carpenter'
];

const steps = ['Basic Information', 'Contact Details', 'Additional Information'];

// Custom styled input for mobile number with country code
const MobileInput = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-focused': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  },
  '&.Mui-error': {
    borderColor: theme.palette.error.main,
  },
}));

const CountryCodeDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '16.5px 14px',
  backgroundColor: theme.palette.primary[50],
  borderRight: `1px solid ${theme.palette.primary[200]}`,
  color: theme.palette.primary.main,
  fontWeight: 600,
  fontSize: '1rem',
  minWidth: '60px',
  justifyContent: 'center',
  borderRadius: '8px 0 0 8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary[100],
  }
}));

export default function UsersCreate() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [openCreateDialog, setOpenCreateDialog] = useState(true);
  const [mobileChecking, setMobileChecking] = useState(false);
  const [mobileCheckTimeout, setMobileCheckTimeout] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);

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
    profession: '',
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

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

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
    
    // Handle email duplication checking
    if (field === 'email' && value.trim()) {
      // Use setTimeout to avoid recursive calls
      setTimeout(() => handleEmailChange(value), 0);
    }
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
        //if (!newUser.lastName.trim()) errors.lastName = 'Last name is required';
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
         else if (newUser.mobile.length !== 10) {
           errors.mobile = 'Mobile number must be exactly 10 digits';
         }
         if (newUser.email.trim() && !/\S+@\S+\.\S+/.test(newUser.email)) {
           errors.email = 'Invalid email format';
         }
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

     const checkExistingUser = async (email, mobile) => {
     try {
       const usersRef = collection(db, 'user_data');
       
       // Check for existing user with same email (only if email is provided)
       if (email && email.trim()) {
         const emailQuery = query(usersRef, where('email', '==', email));
         const emailSnapshot = await getDocs(emailQuery);
         
         if (!emailSnapshot.empty) {
           return { exists: true, field: 'email', message: 'A user with this email already exists.' };
         }
       }
      
      // Normalize the mobile number for comparison
      const normalizedMobile = normalizePhoneNumber(mobile);
      
      // Get all users to check for mobile number matches (since we need to normalize existing numbers)
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      // Check if any existing user has the same normalized mobile number
      for (const doc of allUsersSnapshot.docs) {
        const userData = doc.data();
        if (userData.mobile) {
          const existingNormalized = normalizePhoneNumber(userData.mobile);
          if (existingNormalized === normalizedMobile) {
            return { 
              exists: true, 
              field: 'mobile', 
              message: 'A user with this mobile number already exists.' 
            };
          }
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Error checking existing user:', error);
      throw new Error('Failed to check for existing user. Please try again.');
    }
  };

  // Function to normalize phone numbers for comparison
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove +91 prefix if present and return last 10 digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    return cleaned.slice(-10);
  };

  const handleCreateUser = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);
      setError(null);

      // Check for existing user before creating
      const existingUserCheck = await checkExistingUser(newUser.email, `+91${newUser.mobile}`);
      
      if (existingUserCheck.exists) {
        setError(existingUserCheck.message);
        // Set field error for the specific field
        setFieldErrors(prev => ({
          ...prev,
          [existingUserCheck.field]: existingUserCheck.message
        }));
        return;
      }

      // Calculate profile completion
      const completion = calculateProfileCompletion();
      
      // Save mobile number with +91 prefix
      const mobileWithPrefix = `+91${newUser.mobile}`;
      
      const userData = {
        ...newUser,
        mobile: mobileWithPrefix, // Save with +91 prefix
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
        profession: '',
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
      setProfilePhoto(null);
      setPhotoPreview(null);
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
     const requiredFields = [
       'firstName', 'mobile', 'address', 
       'aadharNo', 'dob', 'profession', 'preferredCompanies', 'teamCode', 'teamName'
     ];
     
     // Add points for required fields
     requiredFields.forEach(field => {
       if (newUser[field]) {
         if (Array.isArray(newUser[field])) {
           if (newUser[field].length > 0) completion += 100 / requiredFields.length;
         } else if (typeof newUser[field] === 'string' && newUser[field].trim() !== '') {
           completion += 100 / requiredFields.length;
         }
       }
     });
     
     // Add bonus points for optional email if provided
     if (newUser.email && newUser.email.trim()) {
       completion += 5; // Bonus points for providing email
     }
     
     return Math.min(100, Math.round(completion));
   };

  const handleEmailChange = async (value) => {
    // Clear previous timeout if exists
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }
    
    // Add a small delay to avoid too many database calls
    const timeout = setTimeout(async () => {
      // Check for duplicate email in database
      setEmailChecking(true);
      try {
        const usersRef = collection(db, 'user_data');
        const emailQuery = query(usersRef, where('email', '==', value));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          setFieldErrors(prev => ({
            ...prev,
            email: 'Email already exists in the system'
          }));
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setEmailChecking(false);
      }
    }, 500); // 500ms delay
    
    setEmailCheckTimeout(timeout);
  };

  const handleMobileChange = async (value) => {
    // Only allow digits and limit to 10 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    handleCreateChange('mobile', cleaned);
    
    // Clear previous timeout if exists
    if (mobileCheckTimeout) {
      clearTimeout(mobileCheckTimeout);
    }
    
    // Clear errors if the number is valid
    if (cleaned.length === 10) {
      clearFieldErrors('mobile');
      
      // Add a small delay to avoid too many database calls
      const timeout = setTimeout(async () => {
        // Check for duplicate mobile number in database
        setMobileChecking(true);
        try {
          const mobileWithPrefix = `+91${cleaned}`;
          const usersRef = collection(db, 'user_data');
          const mobileQuery = query(usersRef, where('mobile', '==', mobileWithPrefix));
          const mobileSnapshot = await getDocs(mobileQuery);
          
          if (!mobileSnapshot.empty) {
            setFieldErrors(prev => ({
              ...prev,
              mobile: 'Mobile number already exists in the system'
            }));
          }
        } catch (error) {
          console.error('Error checking mobile number:', error);
        } finally {
          setMobileChecking(false);
        }
      }, 500); // 500ms delay
      
      setMobileCheckTimeout(timeout);
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

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setProfilePhoto(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      
      reader.onerror = () => {
        setError('Error reading image file');
      };
      
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mobileCheckTimeout) {
        clearTimeout(mobileCheckTimeout);
      }
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [mobileCheckTimeout, emailCheckTimeout]);

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

      <Card sx={{ 
        borderRadius: 4, 
        overflow: 'hidden', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)'
      }}>
        <CardContent sx={{ p: 4 }}>
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
                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
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
                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={newUser.lastName}
                        onChange={(e) => handleCreateChange('lastName', e.target.value)}
              
                        
                        
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
                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
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
                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
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
                                         <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
                       <FormControl fullWidth>
                         <InputLabel>Profession</InputLabel>
                         <Select
                           value={newUser.profession}
                           onChange={(e) => handleCreateChange('profession', e.target.value)}
                           label="Profession"
                           startAdornment={
                             <InputAdornment position="start">
                               <BusinessIcon color="action" />
                             </InputAdornment>
                           }
                         >
                           <MenuItem value="">Select Profession</MenuItem>
                           {professionOptions.map((profession) => (
                             <MenuItem key={profession} value={profession}>
                               {profession}
                             </MenuItem>
                           ))}
                         </Select>
                         <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                           Select your profession from the available options
                         </Typography>
                       </FormControl>
                     </Grid>
                     
                     {/* Profile Photo Upload */}
                     <Grid item xs={12}>
                       <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3, border: '2px dashed', borderColor: 'primary.200', borderRadius: 2, backgroundColor: 'primary.50' }}>
                         <Typography variant="h6" color="primary.main" fontWeight={600}>
                           Profile Photo (Optional)
                         </Typography>
                         
                         {photoPreview ? (
                           <Box sx={{ position: 'relative', display: 'inline-block' }}>
                             <Box
                               component="img"
                               src={photoPreview}
                               alt="Profile Preview"
                               sx={{
                                 width: 120,
                                 height: 120,
                                 borderRadius: '50%',
                                 objectFit: 'cover',
                                 border: '3px solid',
                                 borderColor: 'primary.main',
                                 boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                               }}
                             />
                             <IconButton
                               onClick={handleRemoveProfilePhoto}
                               sx={{
                                 position: 'absolute',
                                 top: -8,
                                 right: -8,
                                 backgroundColor: 'error.main',
                                 color: 'white',
                                 '&:hover': {
                                   backgroundColor: 'error.dark'
                                 },
                                 width: 32,
                                 height: 32
                               }}
                             >
                               <DeleteIcon fontSize="small" />
                             </IconButton>
                           </Box>
                         ) : (
                           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                             <PhotoCameraIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }} />
                             <Typography variant="body2" color="text.secondary" textAlign="center">
                               Click to upload profile photo
                             </Typography>
                             <Typography variant="caption" color="text.secondary" textAlign="center">
                               JPG, PNG or GIF (Max 5MB)
                             </Typography>
                           </Box>
                         )}
                         
                         <Button
                           component="label"
                           variant="outlined"
                           color="primary"
                           startIcon={photoPreview ? <PhotoCameraIcon /> : <AddIcon />}
                           sx={{
                             borderRadius: 2,
                             px: 3,
                             py: 1,
                             textTransform: 'none',
                             fontWeight: 500,
                             borderWidth: 2,
                             '&:hover': {
                               borderWidth: 2,
                               transform: 'translateY(-1px)',
                               boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                             }
                           }}
                         >
                           {photoPreview ? 'Change Photo' : 'Upload Photo'}
                           <input
                             type="file"
                             hidden
                             accept="image/*"
                             onChange={handleProfilePhotoChange}
                           />
                         </Button>
                       </Box>
                     </Grid>
                  </Grid>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                {/* Contact Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: 3,
                    p: 2,
                    backgroundColor: 'primary.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'primary.100'
                  }}>
                    <ContactPhoneIcon color="primary" fontSize="medium" />
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      Contact Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3, opacity: 0.6 }} />
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
                          Mobile Number *
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                          <MobileInput 
                            className={`${fieldErrors.mobile ? 'Mui-error' : ''} ${newUser.mobile.length === 10 ? 'Mui-focused' : ''}`}
                            sx={{ 
                              height: '56px',
                              width: '100%',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              borderRadius: 2,
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transform: 'translateY(-1px)'
                              },
                              '&.Mui-focused': {
                                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                              }
                            }}
                          >
                            <CountryCodeDisplay>
                              +91
                            </CountryCodeDisplay>
                            <InputBase
                              placeholder="Enter 10 digit mobile number"
                              value={newUser.mobile}
                              onChange={(e) => handleMobileChange(e.target.value)}
                              sx={{
                                flex: 1,
                                px: 2,
                                py: 1.5,
                                height: '100%',
                                '& input': {
                                  fontSize: '1rem',
                                  '&::placeholder': {
                                    opacity: 0.7,
                                    color: 'text.secondary'
                                  },
                                },
                              }}
                              inputProps={{
                                maxLength: 10,
                                pattern: '[0-9]*',
                              }}
                            />
                            {mobileChecking && (
                              <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={16} />
                              </Box>
                            )}
                          </MobileInput>
                        </Box>
                        {fieldErrors.mobile && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {fieldErrors.mobile}
                          </Typography>
                        )}
                        {newUser.mobile.length > 0 && newUser.mobile.length < 10 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {10 - newUser.mobile.length} digits remaining
                          </Typography>
                        )}
                        {newUser.mobile.length === 10 && !fieldErrors.mobile && !mobileChecking && (
                          <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon fontSize="small" />
                            Mobile number is available
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
                          Email (Optional)
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                          <TextField
                            fullWidth
                            type="email"
                            value={newUser.email}
                            onChange={(e) => handleCreateChange('email', e.target.value)}
                            error={!!fieldErrors.email}
                            placeholder="Enter email address"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '56px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderRadius: 2,
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transform: 'translateY(-1px)'
                                },
                                '&.Mui-focused': {
                                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                                }
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon color="action" />
                                </InputAdornment>
                              ),
                              endAdornment: emailChecking && (
                                <InputAdornment position="end">
                                  <CircularProgress size={16} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        {fieldErrors.email && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {fieldErrors.email}
                          </Typography>
                        )}
                        {newUser.email && !fieldErrors.email && !emailChecking && (
                          <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon fontSize="small" />
                            Email is available
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
                          Password *
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                          <TextField
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            value={newUser.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            required
                            error={!!fieldErrors.password}
                            placeholder="Enter exactly 6 digits"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '56px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderRadius: 2,
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transform: 'translateY(-1px)'
                                },
                                '&.Mui-focused': {
                                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                                }
                              }
                            }}
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
                                    size="small"
                                  >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        {fieldErrors.password && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {fieldErrors.password}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
                          Aadhar Number (Optional)
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                          <TextField
                            fullWidth
                            value={newUser.aadharNo}
                            onChange={(e) => handleAadharChange(e.target.value)}
                            error={!!fieldErrors.aadharNo}
                            placeholder="Enter 12 digits"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '56px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderRadius: 2,
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transform: 'translateY(-1px)'
                                },
                                '&.Mui-focused': {
                                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                                }
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CreditCardIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        {fieldErrors.aadharNo && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {fieldErrors.aadharNo}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address *"
                        value={newUser.address}
                        onChange={(e) => handleCreateChange('address', e.target.value)}
                        multiline
                        rows={3}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: 2,
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              transform: 'translateY(-1px)'
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                            }
                          }
                        }}
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
                        label="Team Code (Optional)"
                        value={newUser.teamCode}
                        onChange={(e) => handleCreateChange('teamCode', e.target.value)}
                        placeholder="Enter team code"
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
                        label="Team Name (Optional)"
                        value={newUser.teamName}
                        onChange={(e) => handleCreateChange('teamName', e.target.value)}
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