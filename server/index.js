const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let apiKeys = process.env.YOUTUBE_API_KEYS ? process.env.YOUTUBE_API_KEYS.split(',') : [];
let currentKeyIndex = 0;

async function fetchWithKey(videoId, keyIndex, endpoint) {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: {
        part: endpoint === 'title' ? 'snippet' : 'statistics',
        id: videoId,
        key: apiKeys[keyIndex]
      }
    });

    if (response.data.items.length > 0) {
      if (endpoint === 'title') {
        return { title: response.data.items[0].snippet.title };
      } else {
        return { viewCount: response.data.items[0].statistics.viewCount };
      }
    } else {
      return { error: 'Video not found' };
    }
  } catch (error) {
    if (error.response && error.response.data.error && error.response.data.error.message.includes('quota')) {
      if (keyIndex < apiKeys.length - 1) {
        currentKeyIndex = keyIndex + 1;
        return { error: 'Quota exceeded, switching to next key', retry: true };
      } else {
        return { error: 'All API keys have exceeded quota' };
      }
    }
    return { error: error.message || 'Error fetching data' };
  }
}

app.get('/api/views/:videoId', async (req, res) => {
  const { videoId } = req.params;
  let result = await fetchWithKey(videoId, currentKeyIndex, 'views');

  if (result.error && result.retry) {
    result = await fetchWithKey(videoId, currentKeyIndex, 'views');
  }

  if (result.error) {
    res.status(500).json({ error: result.error });
  } else {
    res.json({ viewCount: result.viewCount });
  }
});

app.get('/api/title/:videoId', async (req, res) => {
  const { videoId } = req.params;
  let result = await fetchWithKey(videoId, currentKeyIndex, 'title');

  if (result.error && result.retry) {
    result = await fetchWithKey(videoId, currentKeyIndex, 'title');
  }

  if (result.error) {
    res.status(500).json({ error: result.error });
  } else {
    res.json({ title: result.title });
  }
});

app.post('/api/update-key', (req, res) => {
  const { newApiKey } = req.body;
  if (!newApiKey) {
    return res.status(400).json({ error: 'No API key provided' });
  }
  if (!apiKeys.includes(newApiKey)) {
    apiKeys.push(newApiKey);
    currentKeyIndex = apiKeys.length - 1;
    res.json({ message: 'API key added successfully' });
  } else {
    res.json({ message: 'API key already exists' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
