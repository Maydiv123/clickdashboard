import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Tooltip,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

export default function Ads() {
  // Ad management state
  const [adImages, setAdImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdUrl, setNewAdUrl] = useState('');
  const [editAdDialogOpen, setEditAdDialogOpen] = useState(false);
  const [currentEditAd, setCurrentEditAd] = useState(null);
  const [editAdUrl, setEditAdUrl] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [copySuccess, setCopySuccess] = useState('');
  const [showFullUrls, setShowFullUrls] = useState(false);
  
  // Special offer ad state
  const [specialOfferLoading, setSpecialOfferLoading] = useState(true);
  const [specialOffer, setSpecialOffer] = useState({
    title: 'Special Offer',
    subtitle: 'Limited time promotion',
    imageUrl: ''
  });
  const [specialOfferDialogOpen, setSpecialOfferDialogOpen] = useState(false);

  useEffect(() => {
    // Load ads from Firestore
    fetchAdImages();
    fetchSpecialOffer();
  }, []);

  const fetchAdImages = async () => {
    setLoading(true);
    try {
      const adsQuery = query(collection(db, 'adImages'), orderBy('order'));
      const snapshot = await getDocs(adsQuery);
      
      const ads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAdImages(ads);
    } catch (error) {
      console.error('Error fetching ad images:', error);
      setAlert({
        open: true,
        message: 'Failed to load ad images',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialOffer = async () => {
    setSpecialOfferLoading(true);
    try {
      const docRef = doc(db, 'settings', 'specialOffer');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSpecialOffer(docSnap.data());
      } else {
        // Create default special offer if it doesn't exist
        const defaultOffer = {
          title: 'Special Offer',
          subtitle: 'Limited time promotion',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6S46DNdLXGnF9MaHKWKx4JRhArFU-Jmxg6g&s'
        };
        
        await setDoc(docRef, defaultOffer);
        setSpecialOffer(defaultOffer);
      }
    } catch (error) {
      console.error('Error fetching special offer:', error);
      setAlert({
        open: true,
        message: 'Failed to load special offer data',
        severity: 'error'
      });
    } finally {
      setSpecialOfferLoading(false);
    }
  };

  const handleAddNewAd = async () => {
    if (!newAdUrl.trim()) {
      setAlert({
        open: true,
        message: 'Please enter a valid image URL',
        severity: 'warning'
      });
      return;
    }

    try {
      // Add new ad to Firestore
      await addDoc(collection(db, 'adImages'), {
        imageUrl: newAdUrl,
        order: adImages.length,
        createdAt: new Date()
      });
      
      // Clear input field
      setNewAdUrl('');
      
      // Refresh ad list
      await fetchAdImages();
      
      setAlert({
        open: true,
        message: 'Ad image added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding ad image:', error);
      setAlert({
        open: true,
        message: 'Failed to add ad image',
        severity: 'error'
      });
    }
  };

  const handleDeleteAd = async (id) => {
    try {
      // Delete ad from Firestore
      await deleteDoc(doc(db, 'adImages', id));
      
      // Refresh ad list and reorder remaining ads
      await fetchAdImages();
      await reorderAds();
      
      setAlert({
        open: true,
        message: 'Ad image deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting ad image:', error);
      setAlert({
        open: true,
        message: 'Failed to delete ad image',
        severity: 'error'
      });
    }
  };

  const handleEditAd = (ad) => {
    setCurrentEditAd(ad);
    setEditAdUrl(ad.imageUrl);
    setEditAdDialogOpen(true);
  };

  const handleSaveEditedAd = async () => {
    if (!editAdUrl.trim()) {
      setAlert({
        open: true,
        message: 'Please enter a valid image URL',
        severity: 'warning'
      });
      return;
    }

    try {
      // Update ad in Firestore
      await updateDoc(doc(db, 'adImages', currentEditAd.id), {
        imageUrl: editAdUrl
      });
      
      // Close dialog
      setEditAdDialogOpen(false);
      
      // Refresh ad list
      await fetchAdImages();
      
      setAlert({
        open: true,
        message: 'Ad image updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating ad image:', error);
      setAlert({
        open: true,
        message: 'Failed to update ad image',
        severity: 'error'
      });
    }
  };

  const handleMoveAd = async (adId, direction) => {
    const currentIndex = adImages.findIndex(ad => ad.id === adId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === adImages.length - 1)
    ) {
      return; // Can't move first item up or last item down
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedAds = [...adImages];
    
    // Swap items
    const temp = reorderedAds[currentIndex];
    reorderedAds[currentIndex] = reorderedAds[newIndex];
    reorderedAds[newIndex] = temp;
    
    // Update order property for all ads
    reorderedAds.forEach((ad, index) => {
      ad.order = index;
    });
    
    // Update in state first for responsive UI
    setAdImages(reorderedAds);
    
    // Update in database
    try {
      // Update order for the two affected ads
      const promises = [
        updateDoc(doc(db, 'adImages', reorderedAds[currentIndex].id), {
          order: currentIndex
        }),
        updateDoc(doc(db, 'adImages', reorderedAds[newIndex].id), {
          order: newIndex
        })
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error reordering ads:', error);
      setAlert({
        open: true,
        message: 'Failed to reorder ads',
        severity: 'error'
      });
      // Revert state on error
      fetchAdImages();
    }
  };

  const reorderAds = async () => {
    try {
      // Update order for all ads after deletion
      const promises = adImages.map((ad, index) => {
        return updateDoc(doc(db, 'adImages', ad.id), { order: index });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error reordering ads after deletion:', error);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Format URL for display
  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname.length > 15 ? urlObj.pathname.substring(0, 15) + '...' : urlObj.pathname
      };
    } catch (e) {
      return {
        domain: 'URL',
        path: 'invalid or incomplete'
      };
    }
  };

  // Function to open URL in a new window
  const openUrl = (url) => {
    window.open(url, '_blank');
  };

  const handleOpenSpecialOfferDialog = () => {
    setSpecialOfferDialogOpen(true);
  };

  const handleCloseSpecialOfferDialog = () => {
    setSpecialOfferDialogOpen(false);
  };

  const handleSpecialOfferChange = (field) => (event) => {
    setSpecialOffer({
      ...specialOffer,
      [field]: event.target.value
    });
  };

  const handleSaveSpecialOffer = async () => {
    try {
      const docRef = doc(db, 'settings', 'specialOffer');
      await setDoc(docRef, specialOffer, { merge: true });
      
      setSpecialOfferDialogOpen(false);
      
      setAlert({
        open: true,
        message: 'Special offer updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating special offer:', error);
      setAlert({
        open: true,
        message: 'Failed to update special offer',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Advertisement Management
      </Typography>
      
      {/* Add New Ad Form */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Add New Advertisement
          </Typography>
          <Tooltip title={showFullUrls ? "Hide full URLs" : "Show full URLs"}>
            <IconButton 
              onClick={() => setShowFullUrls(!showFullUrls)}
              color={showFullUrls ? "primary" : "default"}
            >
              {showFullUrls ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 2, display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="New Ad Image URL"
            placeholder="Enter image URL from a public source"
            value={newAdUrl}
            onChange={(e) => setNewAdUrl(e.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNewAd}
            sx={{ height: '56px', minWidth: '120px', whiteSpace: 'nowrap' }}
          >
            Add Image
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Enter a publicly accessible image URL for the advertisement carousel in the mobile app.
        </Typography>
      </Paper>
      
      {/* Ad Images List */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Current Advertisements
          <Chip 
            label={`${adImages.length} ${adImages.length === 1 ? 'image' : 'images'}`} 
            size="small" 
            color="primary" 
            sx={{ ml: 2 }}
          />
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : adImages.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No advertisement images have been added yet.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {adImages.map((ad, index) => {
              const urlInfo = formatUrl(ad.imageUrl);
              return (
                <Grid item xs={12} sm={6} md={4} key={ad.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-4px)', 
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={ad.imageUrl}
                        alt={`Advertisement ${index + 1}`}
                        onClick={() => openUrl(ad.imageUrl)}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x200?text=Image+Error';
                        }}
                        sx={{ 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                      />
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={urlInfo.domain} 
                          size="small" 
                          color="default" 
                          variant="outlined" 
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {urlInfo.path}
                        </Typography>
                      </Box>
                      
                      {showFullUrls && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 1,
                          maxHeight: '70px',
                          overflowY: 'auto',
                          fontSize: '12px',
                          wordBreak: 'break-all'
                        }}>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {ad.imageUrl}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(ad.imageUrl)}
                            sx={{ position: 'absolute', right: 8, opacity: 0.7 }}
                          >
                            <CopyIcon fontSize="inherit" />
                          </IconButton>
                        </Box>
                      )}
                    </CardContent>
                    
                    <Divider sx={{ mx: 2 }} />
                    
                    <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                      <Box>
                        <Tooltip title="Move up">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleMoveAd(ad.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleMoveAd(ad.id, 'down')}
                              disabled={index === adImages.length - 1}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditAd(ad)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteAd(ad.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
      
      {/* Special Offer Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Special Offer Card
          <Chip 
            label="Featured" 
            size="small" 
            color="warning" 
            sx={{ ml: 2 }}
          />
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {specialOfferLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #ff9800 0%, #ff6d00 100%)',
                color: 'white',
                boxShadow: '0 8px 16px rgba(255, 152, 0, 0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CampaignIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">{specialOffer.title}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    {specialOffer.subtitle}
                  </Typography>
                  <Box sx={{ 
                    height: 180, 
                    borderRadius: 1, 
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    <img 
                      src={specialOffer.imageUrl} 
                      alt="Special Offer"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200?text=Special+Offer';
                      }}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={handleOpenSpecialOfferDialog}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    Edit Special Offer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>About Special Offer Card</Typography>
                <Typography variant="body2" paragraph>
                  This special offer card appears in the fourth position of the home screen carousel in the mobile app.
                </Typography>
                <Typography variant="body2" paragraph>
                  Unlike the regular advertisements, this card has a fixed position and includes a title and subtitle that can be customized.
                </Typography>
                <Typography variant="body2">
                  Use this space for your most important promotions or announcements that you want to highlight to all users.
                </Typography>
                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff4e5', borderRadius: 1, border: '1px solid #ffe0b2' }}>
                  <Typography variant="subtitle2" sx={{ color: '#e65100', display: 'flex', alignItems: 'center' }}>
                    <CampaignIcon fontSize="small" sx={{ mr: 1 }} />
                    Note
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#e65100' }}>
                    Changes to the special offer will be immediately visible to all users of the mobile app.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      {/* Instructions Panel */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          About Advertisements
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body2" paragraph>
          The advertisement images you upload here will be shown in the mobile app's home screen carousel. Consider these best practices:
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Image Specifications</Typography>
              <ul style={{ paddingLeft: '20px', marginTop: 0 }}>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Use images with <strong>16:9</strong> aspect ratio for best display
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Recommended resolution: <strong>1280×720px</strong> or higher
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Keep file sizes small (<strong>under 500KB</strong>) for fast loading
                  </Typography>
                </li>
              </ul>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Image Sources</Typography>
              <ul style={{ paddingLeft: '20px', marginTop: 0 }}>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Use publicly accessible image URLs (from image hosting services)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Ensure images are properly optimized for mobile viewing
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Reorder ads using the up/down arrows to change their display order
                  </Typography>
                </li>
              </ul>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Edit Ad Dialog */}
      <Dialog 
        open={editAdDialogOpen} 
        onClose={() => setEditAdDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Advertisement Image</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Image URL"
            fullWidth
            variant="outlined"
            value={editAdUrl}
            onChange={(e) => setEditAdUrl(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => copyToClipboard(editAdUrl)}>
                    <CopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {editAdUrl && (
            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5'
                }}
              >
                <img 
                  src={editAdUrl} 
                  alt="Ad Preview"
                  style={{
                    maxWidth: '100%', 
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 4
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditAdDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSaveEditedAd} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          sx={{ width: '100%' }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseAlert}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {alert.message}
        </Alert>
      </Snackbar>
      
      {/* Copy Success Snackbar */}
      <Snackbar
        open={!!copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={copySuccess}
      />
      
      {/* Special Offer Edit Dialog */}
      <Dialog
        open={specialOfferDialogOpen}
        onClose={handleCloseSpecialOfferDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Special Offer</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Title"
                fullWidth
                variant="outlined"
                value={specialOffer.title}
                onChange={handleSpecialOfferChange('title')}
                helperText="Title displayed at the top of the special offer card"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Subtitle"
                fullWidth
                variant="outlined"
                value={specialOffer.subtitle}
                onChange={handleSpecialOfferChange('subtitle')}
                helperText="Smaller text displayed below the title"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Image URL"
                fullWidth
                variant="outlined"
                value={specialOffer.imageUrl}
                onChange={handleSpecialOfferChange('imageUrl')}
                helperText="URL of the image to display in the special offer card"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => copyToClipboard(specialOffer.imageUrl)}>
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          
          {specialOffer.imageUrl && (
            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5'
                }}
              >
                <img 
                  src={specialOffer.imageUrl} 
                  alt="Special Offer Preview"
                  style={{
                    maxWidth: '100%', 
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 4
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseSpecialOfferDialog} variant="outlined">Cancel</Button>
          <Button onClick={handleSaveSpecialOffer} variant="contained" color="warning">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 