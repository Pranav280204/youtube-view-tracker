let isTracking = false;
let intervalId = null;

document.getElementById('startBtn').addEventListener('click', () => {
  const videoId = document.getElementById('videoId').value.trim();
  const errorDiv = document.getElementById('error');
  if (!videoId) {
    errorDiv.textContent = 'Please enter a valid YouTube Video ID.';
    return;
  }

  if (!isTracking) {
    isTracking = true;
    document.getElementById('startBtn').textContent = 'Stop Tracking';
    fetchViews(videoId);
    intervalId = setInterval(() => fetchViews(videoId), 60000); // Fetch every minute
  } else {
    isTracking = false;
    document.getElementById('startBtn').textContent = 'Start Tracking';
    clearInterval(intervalId);
  }
});

document.getElementById('updateKeyBtn').addEventListener('click', async () => {
  const newApiKey = document.getElementById('apiKey').value.trim();
  const errorDiv = document.getElementById('error');
  if (!newApiKey) {
    errorDiv.textContent = 'Please enter a new API key.';
    return;
  }

  try {
    const response = await fetch('/api/update-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newApiKey })
    });
    const result = await response.json();
    if (response.ok) {
      errorDiv.textContent = result.message;
    } else {
      errorDiv.textContent = result.error;
    }
  } catch (error) {
    errorDiv.textContent = 'Error updating API key: ' + error.message;
  }
});

async function fetchViews(videoId) {
  const errorDiv = document.getElementById('error');
  const viewsSpan = document.getElementById('views');
  try {
    const response = await fetch(`/api/views/${videoId}`);
    const data = await response.json();
    if (response.ok) {
      viewsSpan.textContent = data.viewCount;
      errorDiv.textContent = '';
    } else {
      errorDiv.textContent = data.error;
      if (data.error.includes('Quota exceeded')) {
        isTracking = false;
        document.getElementById('startBtn').textContent = 'Start Tracking';
        clearInterval(intervalId);
      }
    }
  } catch (error) {
    errorDiv.textContent = 'Error fetching views: ' + error.message;
    isTracking = false;
    document.getElementById('startBtn').textContent = 'Start Tracking';
    clearInterval(intervalId);
  }
}