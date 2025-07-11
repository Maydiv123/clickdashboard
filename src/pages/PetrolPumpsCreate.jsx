import React, { useState, useEffect } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import { Add as AddIcon, Help as HelpIcon, Business as BusinessIcon, Person as PersonIcon, Badge as BadgeIcon, LocationOn as LocationIcon, Phone as PhoneIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

export default function PetrolPumpsCreate() {
  const [formData, setFormData] = useState({
    customerName: '',
    dealerName: '',
    company: 'HPCL',
    zone: '',
    salesArea: '',
    coClDo: '',
    regionalOffice: '',
    district: '',
    sapCode: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    pincode: '',
    contactDetails: '',
    latitude: '',
    longitude: '',
    active: true,
    isVerified: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // Zone options
  const zoneOptions = ['North', 'South', 'East', 'West', 'North East', 'Central', 'South East'];

  // CO/CL/DO options
  const coClDoOptions = ['CO', 'CL', 'DO'];

  // Fetch districts from database
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setFetchingDistricts(true);
        const pumpsRef = collection(db, 'petrolPumps');
        const q = query(pumpsRef);
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const districtsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return data.district || data.District || '';
          }).filter(district => district && district.trim() !== '');
          
          // Remove duplicates and sort
          const uniqueDistricts = [...new Set(districtsData)].sort();
          setDistricts(uniqueDistricts);
        }
      } catch (err) {
        console.error('Error fetching districts:', err);
      } finally {
        setFetchingDistricts(false);
      }
    };

    fetchDistricts();
  }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
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

  // Input validation functions
  const handleContactChange = (value) => {
    // Only allow digits and limit to 10 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    handleInputChange('contactDetails', cleaned);
  };

  const handleSapCodeChange = (value) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    handleInputChange('sapCode', cleaned);
  };

  const handlePincodeChange = (value) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    handleInputChange('pincode', cleaned);
  };

  const handleLatitudeChange = (value) => {
    // Allow digits, decimal point, and minus sign
    const cleaned = value.replace(/[^\d.-]/g, '');
    handleInputChange('latitude', cleaned);
  };

  const handleLongitudeChange = (value) => {
    // Allow digits, decimal point, and minus sign
    const cleaned = value.replace(/[^\d.-]/g, '');
    handleInputChange('longitude', cleaned);
  };

  const validateForm = () => {
    const errors = {};
    let hasErrors = false;
    
    // Required field validations
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
      hasErrors = true;
    }
    
    if (!formData.dealerName.trim()) {
      errors.dealerName = 'Dealer name is required';
      hasErrors = true;
    }
    
    if (!formData.company.trim()) {
      errors.company = 'Company is required';
      hasErrors = true;
    }
    
    if (!formData.zone.trim()) {
      errors.zone = 'Zone is required';
      hasErrors = true;
    }
    
    if (!formData.salesArea.trim()) {
      errors.salesArea = 'Sales area is required';
      hasErrors = true;
    }
    
    if (!formData.coClDo.trim()) {
      errors.coClDo = 'CO/CL/DO is required';
      hasErrors = true;
    }
    
    if (!formData.regionalOffice.trim()) {
      errors.regionalOffice = 'Regional office is required';
      hasErrors = true;
    }
    
    if (!formData.district.trim()) {
      errors.district = 'District is required';
      hasErrors = true;
    }
    
    if (!formData.sapCode.trim()) {
      errors.sapCode = 'SAP code is required';
      hasErrors = true;
    } else if (!/^\d{6,}$/.test(formData.sapCode)) {
      errors.sapCode = 'SAP code must be at least 6 digits';
      hasErrors = true;
    }
    
    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = 'Address line 1 is required';
      hasErrors = true;
    }
    
    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
      hasErrors = true;
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be exactly 6 digits';
      hasErrors = true;
    }
    
    if (!formData.contactDetails.trim()) {
      errors.contactDetails = 'Contact details are required';
      hasErrors = true;
    } else if (!/^\d{10}$/.test(formData.contactDetails.replace(/\s/g, ''))) {
      errors.contactDetails = 'Contact number must be exactly 10 digits';
      hasErrors = true;
    }
    
    // Validate latitude and longitude if provided
    if (formData.latitude.trim()) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude must be a valid number between -90 and 90';
        hasErrors = true;
      }
    } else {
      errors.latitude = 'Latitude is required';
      hasErrors = true;
    }
    
    if (formData.longitude.trim()) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Longitude must be a valid number between -180 and 180';
        hasErrors = true;
      }
    } else {
      errors.longitude = 'Longitude is required';
      hasErrors = true;
    }
    
    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = validateForm();
    if (!isValid) {
      setError('Please fix the validation errors below');
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const pumpData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'petrolPumps'), pumpData);
      
      setSuccess(true);
      setFormData({
        customerName: '',
        dealerName: '',
        company: 'HPCL',
        zone: '',
        salesArea: '',
        coClDo: '',
        regionalOffice: '',
        district: '',
        sapCode: '',
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        addressLine4: '',
        pincode: '',
        contactDetails: '',
        latitude: '',
        longitude: '',
        active: true,
        isVerified: false
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating petrol pump:', err);
      setError('Failed to create petrol pump. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Create New Petrol Pump
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          onClick={() => setHelpDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Help
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Petrol pump created successfully!
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} direction="column">
              {/* Basic Information Section */}
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                </Box>
              </Grid>

              <Grid container spacing={2}>

              <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                  <FormControl fullWidth required>
                    <InputLabel>Company</InputLabel>
                    <Select
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <BusinessIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="HPCL">HPCL</MenuItem>
                      <MenuItem value="BPCL">BPCL</MenuItem>
                      <MenuItem value="IOCL">IOCL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '700px' }}>
                  <TextField
                    fullWidth
                    label="Petrol Pump Name"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    required
                    error={!!fieldErrors.customerName}
                    helperText={fieldErrors.customerName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                  <TextField
                    fullWidth
                    label="SAP Code"
                    value={formData.sapCode}
                    onChange={(e) => handleSapCodeChange(e.target.value)}
                    required
                    error={!!fieldErrors.sapCode}
                    helperText={fieldErrors.sapCode}
                    placeholder="Enter at least 6 digits (numbers only)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '700px' }}>
                  <TextField
                    fullWidth
                    label="Dealer Name"
                    value={formData.dealerName}
                    onChange={(e) => handleInputChange('dealerName', e.target.value)}
                    required
                    error={!!fieldErrors.dealerName}
                    helperText={fieldErrors.dealerName}
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

              {/* Company Information and Contact Information Sections Side by Side */}
              <Grid container spacing={3} >
                {/* Company Information Section - 80% */}
                <Grid item xs={12} md={8.6} sx={{ width: '650px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Company Information
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
                      <FormControl fullWidth required error={!!fieldErrors.zone}>
                        <InputLabel>Zone</InputLabel>
                        <Select
                          value={formData.zone}
                          onChange={(e) => handleInputChange('zone', e.target.value)}
                          startAdornment={
                            <InputAdornment position="start">
                              <LocationIcon color="action" />
                            </InputAdornment>
                          }
                        >
                          {zoneOptions.map((zone) => (
                            <MenuItem key={zone} value={zone}>
                              {zone}
                            </MenuItem>
                          ))}
                        </Select>
                        {fieldErrors.zone && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {fieldErrors.zone}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                      <TextField
                        fullWidth
                        label="Sales Area"
                        value={formData.salesArea}
                        onChange={(e) => handleInputChange('salesArea', e.target.value)}
                        required
                        error={!!fieldErrors.salesArea}
                        helperText={fieldErrors.salesArea}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ width: '200px' }}>
                      <FormControl fullWidth required error={!!fieldErrors.coClDo}>
                        <InputLabel>CO/CL/DO</InputLabel>
                        <Select
                          value={formData.coClDo}
                          onChange={(e) => handleInputChange('coClDo', e.target.value)}
                          startAdornment={
                            <InputAdornment position="start">
                              <BusinessIcon color="action" />
                            </InputAdornment>
                          }
                        >
                          {coClDoOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                        {fieldErrors.coClDo && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {fieldErrors.coClDo}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ width: '400px' }}>
                      <TextField
                        fullWidth
                        label="Regional Office"
                        value={formData.regionalOffice}
                        onChange={(e) => handleInputChange('regionalOffice', e.target.value)}
                        required
                        error={!!fieldErrors.regionalOffice}
                        helperText={fieldErrors.regionalOffice}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Contact Information Section - 20% */}
                <Grid item xs={12} md={3.6} sx={{ width: '300px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Contact Information
                    </Typography>
                  </Box>

                  <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                    <TextField
                      fullWidth
                      label="Contact Details"
                      value={formData.contactDetails}
                      onChange={(e) => handleContactChange(e.target.value)}
                      required
                      error={!!fieldErrors.contactDetails}
                      helperText={fieldErrors.contactDetails}
                      placeholder="Enter exactly 10 digits"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Location Information Section */}
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Location Information
                  </Typography>
                </Box>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                  <Autocomplete
                    freeSolo
                    value={formData.district}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        handleInputChange('district', newValue);
                      } else if (newValue && newValue.inputValue) {
                        handleInputChange('district', newValue.inputValue);
                      } else if (newValue) {
                        handleInputChange('district', newValue.title);
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      handleInputChange('district', newInputValue);
                    }}
                    options={districts.map((district) => ({
                      title: district,
                      inputValue: district
                    }))}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        return option;
                      }
                      if (option.inputValue) {
                        return option.inputValue;
                      }
                      return option.title;
                    }}
                    filterOptions={(options, params) => {
                      const filtered = options.filter((option) =>
                        option.title.toLowerCase().includes(params.inputValue.toLowerCase())
                      );
                      
                      const { inputValue } = params;
                      const isExisting = options.some((option) => inputValue === option.title);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          title: `Add "${inputValue}"`,
                        });
                      }
                      
                      return filtered;
                    }}
                    renderOption={(props, option) => (
                      <li {...props}>
                        {option.title}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="District"
                        required
                        error={!!fieldErrors.district}
                        helperText={fieldErrors.district}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {fetchingDistricts ? (
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={formData.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    required
                    error={!!fieldErrors.pincode}
                    helperText={fieldErrors.pincode}
                    placeholder="Enter exactly 6 digits"
                    inputProps={{ maxLength: 6 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '800px' }}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    required
                    error={!!fieldErrors.addressLine1}
                    helperText={fieldErrors.addressLine1}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '800px' }}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={formData.addressLine2}
                    placeholder='(Optional)'
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 3"
                    value={formData.addressLine3}
                    onChange={(e) => handleInputChange('addressLine3', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid> */}

                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 4"
                    value={formData.addressLine4}
                    onChange={(e) => handleInputChange('addressLine4', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid> */}

                
              </Grid>

              

              {/* Coordinates Section */}
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                  <MyLocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Coordinates
                  </Typography>
                </Box>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={formData.latitude}
                    onChange={(e) => handleLatitudeChange(e.target.value)}
                    required
                    error={!!fieldErrors.latitude}
                    helperText={fieldErrors.latitude}
                    placeholder="Enter latitude between -90 and 90 (e.g., 28.6139)"
                    type="number"
                    inputProps={{ step: 'any' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MyLocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ width: '300px' }}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={formData.longitude}
                    onChange={(e) => handleLongitudeChange(e.target.value)}
                    required
                    error={!!fieldErrors.longitude}
                    helperText={fieldErrors.longitude}
                    placeholder="Enter longitude between -180 and 180 (e.g., 77.2090)"
                    type="number"
                    inputProps={{ step: 'any' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MyLocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Location Map */}
              {(formData.latitude && formData.longitude) && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mt: 2 }}>
                      <MyLocationIcon />
                      Location Map
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<MyLocationIcon />}
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`;
                        window.open(url, '_blank');
                      }}
                      sx={{ 
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontWeight: 500
                      }}
                    >
                      View in Larger Map
                    </Button>
                  </Box>
                  
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 300, 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'grey.100'
                    }}
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${formData.latitude},${formData.longitude}`}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </Box>
                  
                  <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Latitude:</strong> {formData.latitude}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Longitude:</strong> {formData.longitude}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Submit Button */}
              <Grid item sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Petrol Pump'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Help - Create Petrol Pump
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            <strong>Required Fields (All fields are mandatory except Address Lines 2, 3, 4):</strong>
          </Typography>
          <ul>
            <li><strong>Customer Name:</strong> The name of the customer or petrol pump</li>
            <li><strong>Dealer Name:</strong> The name of the dealer</li>
            <li><strong>Company:</strong> Select from HPCL, BPCL, or IOCL</li>
            <li><strong>Zone:</strong> Select from North, South, East, West, North East, Central, or South East</li>
            <li><strong>Sales Area:</strong> The sales area designation</li>
            <li><strong>CO/CL/DO:</strong> Select from CO, CL, or DO</li>
            <li><strong>Regional Office:</strong> The regional office location</li>
            <li><strong>District:</strong> Type to search existing districts or add new ones</li>
            <li><strong>SAP Code:</strong> Must be at least 6 digits (numbers only)</li>
            <li><strong>Address Line 1:</strong> Primary address information</li>
            <li><strong>Pincode:</strong> Exactly 6 digits (numbers only)</li>
            <li><strong>Contact Details:</strong> Exactly 10 digits (numbers only)</li>
            <li><strong>Latitude:</strong> Valid coordinate between -90 and 90</li>
            <li><strong>Longitude:</strong> Valid coordinate between -180 and 180</li>
          </ul>
          
          <Typography paragraph>
            <strong>Optional Fields:</strong>
          </Typography>
          <ul>
            <li><strong>Address Line 2:</strong> Additional address information</li>
            <li><strong>Address Line 3:</strong> Additional address information</li>
            <li><strong>Address Line 4:</strong> Additional address information</li>
          </ul>
          
          <Typography paragraph>
            <strong>Validation Rules:</strong>
          </Typography>
          <ul>
            <li><strong>Contact Details:</strong> Must be exactly 10 digits, no alphabets allowed</li>
            <li><strong>SAP Code:</strong> Must be at least 6 digits, numbers only</li>
            <li><strong>Pincode:</strong> Must be exactly 6 digits, numbers only</li>
            <li><strong>Latitude:</strong> Must be a valid number between -90 and 90</li>
            <li><strong>Longitude:</strong> Must be a valid number between -180 and 180</li>
            <li><strong>District:</strong> Can be typed and will be added to database if not found</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 