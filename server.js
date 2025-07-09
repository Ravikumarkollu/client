require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/news-hub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferences: {
    language: { type: String, default: 'en' },
    country: { type: String, default: 'us' },
    category: { type: String, default: 'general' }
  }
});

const User = mongoose.model('User', userSchema);

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded._id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Invalid token' });
  }
};

// API Keys
const API_KEYS = {
  guardian: '2872345c-de46-4bd5-bf78-75e810799e89',
  mediastack: 'c4440d404909e2dfe640d6844b29eb8c'
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) throw new Error();
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error();
    
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
    res.send({ user, token });
  } catch (err) {
    res.status(400).send({ error: 'Login failed' });
  }
});

app.get('/api/user', authenticate, (req, res) => {
  res.send(req.user);
});

app.put('/api/preferences', authenticate, async (req, res) => {
  try {
    const { language, country, category } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: { language, country, category } },
      { new: true }
    );
    res.send(user);
  } catch (err) {
    res.status(400).send({ error: 'Update failed' });
  }
});

// News fetching endpoint with improved error handling
app.get('/api/news', async (req, res) => {
  try {
    const { query, language, country, category } = req.query;
    
    // Initialize empty arrays for each source
    let guardianArticles = [];
    let mediaStackArticles = [];
    
    // Fetch from The Guardian
    try {
      const guardianUrl = `https://content.guardianapis.com/search?api-key=${API_KEYS.guardian}&q=${query || ''}&lang=${language || 'en'}&section=${category || 'world'}`;
      const guardianResponse = await axios.get(guardianUrl);
      guardianArticles = (guardianResponse.data.response.results || []).map(article => ({ 
        title: article.webTitle,
        url: article.webUrl,
        description: 'Read the full story on The Guardian',
        publishedAt: article.webPublicationDate || new Date().toISOString(),
        source: 'The Guardian',
        urlToImage: 'https://assets.guim.co.uk/images/guardian-logo-rss.png'
      }));
    } catch (err) {
      console.error('Guardian error:', err.message);
    }
    
    // Fetch from MediaStack
    try {
      const mediaStackUrl = `http://api.mediastack.com/v1/news?access_key=${API_KEYS.mediastack}&keywords=${query || ''}&languages=${language || 'en'}&countries=${country || 'us'}&categories=${category || 'general'}`;
      const mediaStackResponse = await axios.get(mediaStackUrl);
      mediaStackArticles = (mediaStackResponse.data.data || []).map(article => ({ 
        ...article,
        source: 'MediaStack',
        urlToImage: article.image || 'https://mediastack.com/images/mediastack-logo.png',
        publishedAt: article.published_at || new Date().toISOString()
      }));
    } catch (err) {
      console.error('MediaStack error:', err.message);
    }
    
    // Combine and shuffle results
    const combinedNews = [...guardianArticles, ...mediaStackArticles]
      .sort(() => 0.5 - Math.random());
    
    res.send(combinedNews);
  } catch (err) {
    console.error('Error in news endpoint:', err);
    res.status(500).send({ error: 'Failed to fetch news from all sources' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));