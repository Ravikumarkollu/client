import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Container, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  CircularProgress,
  IconButton,
  Box,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Search, 
  Login, 
  Logout, 
  Bookmark, 
  BookmarkBorder,
  Share,
  Brightness4,
  Brightness7,
  Menu,
  Close
} from '@mui/icons-material';
import { format } from 'date-fns';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Mock news data to replace API calls
const mockNewsData = [
  {
    title: 'Breaking News: Major Event Occurs',
    description: 'A significant event has taken place that will impact many people around the world.',
    url: 'https://example.com/news/1',
    urlToImage: 'https://via.placeholder.com/800x400?text=Breaking+News',
    publishedAt: new Date().toISOString(),
    source: { name: 'Global News' },
    category: 'general',
    isBookmarked: false
  },
  {
    title: 'Tech Giant Announces New Product',
    description: 'The latest innovation from a leading technology company promises to change the market.',
    url: 'https://example.com/news/2',
    urlToImage: 'https://via.placeholder.com/800x400?text=Tech+News',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    source: { name: 'Tech Today' },
    category: 'technology',
    isBookmarked: false
  },
  {
    title: 'Sports Team Wins Championship',
    description: 'After a thrilling season, the team has claimed the top prize in their league.',
    url: 'https://example.com/news/3',
    urlToImage: 'https://via.placeholder.com/800x400?text=Sports+News',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    source: { name: 'Sports Network' },
    category: 'sports',
    isBookmarked: false
  },
  {
    title: 'Health Breakthrough Discovered',
    description: 'Researchers have made an important discovery that could lead to new treatments.',
    url: 'https://example.com/news/4',
    urlToImage: 'https://via.placeholder.com/800x400?text=Health+News',
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    source: { name: 'Medical Journal' },
    category: 'health',
    isBookmarked: false
  },
  {
    title: 'Economic Trends for the Coming Year',
    description: 'Experts predict what businesses and consumers can expect in the next fiscal year.',
    url: 'https://example.com/news/5',
    urlToImage: 'https://via.placeholder.com/800x400?text=Business+News',
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    source: { name: 'Financial Times' },
    category: 'business',
    isBookmarked: false
  },
  {
    title: 'Entertainment Industry Updates',
    description: 'The latest news from Hollywood and the global entertainment scene.',
    url: 'https://example.com/news/6',
    urlToImage: 'https://via.placeholder.com/800x400?text=Entertainment',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    source: { name: 'Entertainment Weekly' },
    category: 'entertainment',
    isBookmarked: false
  },
];

const NewsAggregator = () => {
  const [news, setNews] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    language: 'en',
    country: 'us',
    category: 'general'
  });
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    username: '',
    password: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Custom theme with vibrant colors
  const appTheme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#1a1a1a',
        secondary: darkMode ? '#b3b3b3' : '#4d4d4d',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f7fa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      h4: {
        fontWeight: 700,
        color: darkMode ? '#ffffff' : '#2c3e50',
      },
      h5: {
        fontWeight: 600,
        color: darkMode ? '#ffffff' : '#2c3e50',
      },
      h6: {
        fontWeight: 600,
        color: darkMode ? '#ffffff' : '#34495e',
      },
      body1: {
        color: darkMode ? '#e0e0e0' : '#34495e',
        lineHeight: 1.6,
      },
      body2: {
        color: darkMode ? '#b3b3b3' : '#7f8c8d',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
    },
  });

  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Mock user data
      setUser({
        username: 'demoUser',
        avatar: 'https://via.placeholder.com/150',
        preferences: {
          language: 'en',
          country: 'us',
          category: 'general'
        },
        bookmarks: []
      });
      
      const savedBookmarks = localStorage.getItem('bookmarks');
      if (savedBookmarks) {
        setBookmarkedArticles(JSON.parse(savedBookmarks));
      }
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    }
  }, []);

  // Fetch news when filters or search query changes
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Filter mock data based on search and filters
      let filteredNews = mockNewsData.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            article.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filters.category === 'general' || article.category === filters.category;
        return matchesSearch && matchesCategory;
      });
      
      if (filteredNews.length > 0) {
        // Mark bookmarked articles
        const articlesWithBookmarks = filteredNews.map(article => ({
          ...article,
          isBookmarked: bookmarkedArticles.some(b => b.url === article.url)
        }));
        
        setNews(articlesWithBookmarks);
        
        // Set first 3 articles as featured
        setFeaturedNews(articlesWithBookmarks.slice(0, 3));
      } else {
        setError('No news articles found. Try different search terms or filters.');
        setNews([]);
        setFeaturedNews([]);
      }
    } catch (err) {
      setError('Failed to fetch news. Please try again later.');
      console.error('Error:', err.message);
      setNews([]);
      setFeaturedNews([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, bookmarkedArticles]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication
      const token = 'mock-token-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('token', token);
      
      const mockUser = {
        username: authData.username || 'demoUser',
        avatar: 'https://via.placeholder.com/150',
        preferences: filters,
        bookmarks: []
      };
      
      setUser(mockUser);
      setAuthOpen(false);
      setSnackbar({
        open: true,
        message: `Successfully ${authMode === 'login' ? 'logged in' : 'registered'}`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Authentication failed: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSnackbar({
      open: true,
      message: 'Logged out successfully',
      severity: 'info'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const toggleBookmark = (article) => {
    const isBookmarked = bookmarkedArticles.some(a => a.url === article.url);
    let updatedBookmarks;
    
    if (isBookmarked) {
      updatedBookmarks = bookmarkedArticles.filter(a => a.url !== article.url);
    } else {
      updatedBookmarks = [...bookmarkedArticles, article];
    }
    
    setBookmarkedArticles(updatedBookmarks);
    
    // Update bookmarks in state
    setNews(prevNews => 
      prevNews.map(a => 
        a.url === article.url ? { ...a, isBookmarked: !isBookmarked } : a
      )
    );
    
    setFeaturedNews(prevFeatured => 
      prevFeatured.map(a => 
        a.url === article.url ? { ...a, isBookmarked: !isBookmarked } : a
      )
    );
    
    // Save to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    
    setSnackbar({
      open: true,
      message: isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
      severity: 'success'
    });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const handleShare = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(article.url);
      setSnackbar({
        open: true,
        message: 'Link copied to clipboard',
        severity: 'info'
      });
    }
  };

  const groupedNews = news.reduce((acc, article) => {
    const category = article.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(article);
    return acc;
  }, {});

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
      }}>
        {/* Updated Header with Larger Search */}
        <AppBar position="sticky" elevation={0} sx={{ 
          borderBottom: darkMode ? '1px solid #333' : '1px solid #e0e0e0',
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff'
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2, display: { sm: 'none' } }}
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu />
              </IconButton>
              
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #3f51b5, #2196f3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 3
              }}>
                NewsHub
              </Typography>
            </Box>
            
            {/* Larger Search Bar */}
            <Box sx={{ 
              flexGrow: 1,
              maxWidth: '600px',
              mx: 2,
              display: { xs: 'none', sm: 'block' }
            }}>
              <TextField
                fullWidth
                variant="outlined"
                size="medium"
                placeholder="Search for news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                  backgroundColor: darkMode ? '#333' : '#ffffff',
                  borderRadius: '30px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: darkMode ? '#555' : '#ccc',
                    },
                    '&:hover fieldset': {
                      borderColor: darkMode ? '#777' : '#aaa',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ 
                      color: darkMode ? '#aaa' : '#666', 
                      mr: 1,
                      fontSize: '1.5rem'
                    }} />
                  ),
                  sx: {
                    fontSize: '1.1rem',
                    height: '48px',
                  }
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
                <IconButton 
                  color="inherit" 
                  onClick={toggleDarkMode} 
                  sx={{ 
                    mr: 1,
                    color: darkMode ? '#ffca28' : '#5c6bc0'
                  }}
                >
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              
              {user ? (
                <>
                  <Avatar 
                    alt={user.username} 
                    src={user.avatar} 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      mr: 1,
                      border: `2px solid ${darkMode ? '#ffca28' : '#5c6bc0'}` 
                    }} 
                  />
                  <IconButton 
                    color="inherit" 
                    onClick={handleLogout}
                    sx={{ color: darkMode ? '#ef5350' : '#d32f2f' }}
                  >
                    <Logout />
                  </IconButton>
                </>
              ) : (
                <IconButton 
                  color="inherit" 
                  onClick={() => setAuthOpen(true)}
                  sx={{ color: darkMode ? '#66bb6a' : '#2e7d32' }}
                >
                  <Login />
                </IconButton>
              )}
            </Box>
          </Toolbar>
          
          {/* Mobile Search - appears only on small screens */}
          <Box sx={{ 
            px: 2, 
            pb: 1,
            display: { xs: 'block', sm: 'none' }
          }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                backgroundColor: darkMode ? '#333' : '#ffffff',
                borderRadius: '20px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                },
              }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Box>
        </AppBar>

        {/* Mobile Menu */}
        <Dialog
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Menu</Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button 
                fullWidth 
                variant="text"
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
                sx={{ justifyContent: 'flex-start' }}
              >
                Home
              </Button>
              <Button 
                fullWidth 
                variant="text"
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
                sx={{ justifyContent: 'flex-start' }}
              >
                Bookmarks
              </Button>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">Dark Mode</Typography>
                <IconButton onClick={toggleDarkMode}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
          {/* Filters */}
          <Paper sx={{ 
            p: 2, 
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: 'center'
          }}>
            <Button 
              variant="outlined" 
              onClick={() => setMobileFiltersOpen(true)}
              sx={{ display: { sm: 'none' } }}
            >
              Filters
            </Button>
            
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              gap: 2, 
              width: '100%' 
            }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  name="language"
                  value={filters.language}
                  onChange={handleFilterChange}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Country</InputLabel>
                <Select
                  name="country"
                  value={filters.country}
                  onChange={handleFilterChange}
                  label="Country"
                >
                  <MenuItem value="us">United States</MenuItem>
                  <MenuItem value="gb">United Kingdom</MenuItem>
                  <MenuItem value="in">India</MenuItem>
                  <MenuItem value="ca">Canada</MenuItem>
                  <MenuItem value="au">Australia</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  label="Category"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="entertainment">Entertainment</MenuItem>
                  <MenuItem value="health">Health</MenuItem>
                  <MenuItem value="science">Science</MenuItem>
                  <MenuItem value="sports">Sports</MenuItem>
                  <MenuItem value="technology">Technology</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                onClick={fetchNews}
                sx={{ ml: 'auto' }}
                startIcon={<Search />}
              >
                Apply
              </Button>
            </Box>
          </Paper>

          {/* Mobile Filters Dialog */}
          <Dialog
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Filters</Typography>
                <IconButton onClick={() => setMobileFiltersOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      name="language"
                      value={filters.language}
                      onChange={handleFilterChange}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      name="country"
                      value={filters.country}
                      onChange={handleFilterChange}
                      label="Country"
                    >
                      <MenuItem value="us">United States</MenuItem>
                      <MenuItem value="gb">United Kingdom</MenuItem>
                      <MenuItem value="in">India</MenuItem>
                      <MenuItem value="ca">Canada</MenuItem>
                      <MenuItem value="au">Australia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      label="Category"
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                      <MenuItem value="entertainment">Entertainment</MenuItem>
                      <MenuItem value="health">Health</MenuItem>
                      <MenuItem value="science">Science</MenuItem>
                      <MenuItem value="sports">Sports</MenuItem>
                      <MenuItem value="technology">Technology</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMobileFiltersOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setMobileFiltersOpen(false);
                  fetchNews();
                }}
              >
                Apply Filters
              </Button>
            </DialogActions>
          </Dialog>

          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}

          {error && !loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
                <Button 
                  variant="text" 
                  color="inherit" 
                  size="small" 
                  onClick={fetchNews}
                  sx={{ ml: 1 }}
                >
                  Retry
                </Button>
              </Alert>
            </Box>
          )}

          {/* Featured News Section */}
          {featuredNews.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 700, 
                mb: 3,
                color: darkMode ? '#bb86fc' : '#5c6bc0'
              }}>
                Featured Stories
              </Typography>
              <Grid container spacing={3}>
                {featuredNews.map((article, index) => (
                  <Grid item xs={12} md={6} lg={4} key={`featured-${index}`}>
                    <Card sx={{ height: '100%' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={article.urlToImage}
                        alt={article.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="h2" sx={{
                          color: darkMode ? '#bb86fc' : '#3f51b5',
                          minHeight: '64px'
                        }}>
                          {article.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                          {article.description?.substring(0, 120) || 'No description available.'}
                          {article.description?.length > 120 && '...'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={article.source?.name || article.source} 
                            size="small" 
                            sx={{ 
                              mr: 1,
                              backgroundColor: darkMode ? '#3700b3' : '#e8eaf6',
                              color: darkMode ? '#ffffff' : '#3f51b5'
                            }}
                          />
                          <Typography variant="caption" sx={{ 
                            color: darkMode ? '#cfd8dc' : '#78909c'
                          }}>
                            {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                        <Button 
                          size="small" 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ 
                            color: darkMode ? '#bb86fc' : '#5c6bc0',
                            fontWeight: 600
                          }}
                        >
                          Read More
                        </Button>
                        <Box>
                          <Tooltip title={article.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleBookmark(article)}
                              sx={{ 
                                color: article.isBookmarked 
                                  ? (darkMode ? '#ffca28' : '#ff9800') 
                                  : (darkMode ? '#757575' : '#bdbdbd')
                              }}
                            >
                              {article.isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share">
                            <IconButton 
                              size="small" 
                              onClick={() => handleShare(article)}
                              sx={{ color: darkMode ? '#64b5f6' : '#2196f3' }}
                            >
                              <Share />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Category Sections */}
          {Object.entries(groupedNews).map(([category, articles]) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 700, 
                mb: 3,
                color: darkMode ? '#bb86fc' : '#5c6bc0',
                textTransform: 'capitalize'
              }}>
                {category}
              </Typography>
              <Grid container spacing={3}>
                {articles.map((article, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={`${category}-${index}`}>
                    <Card sx={{ height: '100%' }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={article.urlToImage}
                        alt={article.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="subtitle1" component="h3" sx={{
                          fontWeight: 600,
                          color: darkMode ? '#e1bee7' : '#7e57c2',
                          minHeight: '72px'
                        }}>
                          {article.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                          {article.description?.substring(0, 100) || 'No description available.'}
                          {article.description?.length > 100 && '...'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ 
                            color: darkMode ? '#cfd8dc' : '#78909c'
                          }}>
                            {format(new Date(article.publishedAt), 'MMM d')}
                          </Typography>
                          <Box>
                            <Tooltip title={article.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleBookmark(article)}
                                sx={{ 
                                  color: article.isBookmarked 
                                    ? (darkMode ? '#ffca28' : '#ff9800') 
                                    : (darkMode ? '#757575' : '#bdbdbd')
                                }}
                              >
                                {article.isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {news.length === 0 && !loading && !error && (
            <Box display="flex" justifyContent="center" my={4}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  No news articles found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search query or filters to find relevant news.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      language: 'en',
                      country: 'us',
                      category: 'general'
                    });
                    fetchNews();
                  }}
                >
                  Reset Filters
                </Button>
              </Paper>
            </Box>
          )}
        </Container>

        {/* Auth Dialog */}
        <Dialog
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              {authMode === 'login' ? 'Welcome back!' : 'Create an account'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleAuthSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label="Username"
                value={authData.username}
                onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                required
                autoFocus
              />
              <TextField
                fullWidth
                margin="normal"
                label="Password"
                type="password"
                value={authData.password}
                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                required
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  type="button"
                  color="primary"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  size="small"
                >
                  {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  sx={{ px: 4 }}
                >
                  {authMode === 'login' ? 'Login' : 'Register'}
                </Button>
              </Box>
            </form>
          </DialogContent>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default NewsAggregator;