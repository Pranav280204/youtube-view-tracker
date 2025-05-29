const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store API key in environment variable (updated via endpoint)
let youtubeApiKey = process.env.YOUTUBE_API_KEY || 'YOUR_DEFAULT_API_KEY';

// Endpoint to fetch video views
app.get('/api/views/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${youtubeApiKey}`
    );
    const viewCount = response.data.items[0]?.statistics?.viewCount || '0';
    res.json({ viewCount });
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.error?.errors[0]?.reason === 'quotaExceeded') {
      res.status(403).json({ error: 'Quota exceeded for API key. Please update the API key.' });
    } else {
      res.status(500).json({ error: 'Error fetching views: ' + error.message });
    }
  }
});

// Endpoint to update API key
app.post('/api/update-key', (req, res) => {
  const { newApiKey } = req.body;
  if (!newApiKey) {
    return res.status(400).json({ error: 'New API key is required.' });
  }
  youtubeApiKey = newApiKey;
  res.json({ message: 'API key updated successfully.' });
});

// Serve static files from the public directory
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});