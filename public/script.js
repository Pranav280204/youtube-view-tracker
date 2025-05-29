let isTracking = false;
let intervalId = null;

function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    let videoId = null;

    // Handle standard YouTube URLs (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      videoId = urlObj.searchParams.get('v');
    }
    // Handle shortened YouTube URLs (e.g., https://youtu.be/VIDEO_ID)
    else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.split('/')[1];
    }

    // Validate video ID (11 characters, alphanumeric with specific symbols)
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }
    return null;
  } catch (error) {
    return null;
  }
}

document.getElementById('startBtn').addEventListener('click', () => {
  const input = document.getElementById('videoId').value.trim();
  const errorDiv = document.getElementById('error');
  const loadingDiv = document.getElementById('loading');
  
  const videoId = extractVideoId(input);
  if (!videoId) {
    errorDiv.textContent = 'Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ).';
    errorDiv.classList.remove('hidden');
    return;
  }

  if (!isTracking) {
    isTracking = true;
    document.getElementById('startBtn').textContent = 'Stop Tracking';
    document.getElementById('startBtn').classList.remove('bg-blue-500', 'hover:bg-blue-600');
    document.getElementById('startBtn').classList.add('bg-red-500', 'hover:bg-red-600');
    errorDiv.classList.add('hidden');
    fetchViews(videoId);
    intervalId = setInterval(() => fetchViews(videoId), 1000); // Fetch every 1 second
  } else {
    isTracking = false;
    document.getElementById('startBtn').textContent = 'Start Tracking';
    document.getElementById('startBtn').classList.remove('bg-red-500', 'hover:bg-red-600');
    document.getElementById('startBtn').classList.add('bg-blue-500', 'hover:bg-blue-600');
    clearInterval(intervalId);
    loadingDiv.classList.add('hidden');
  }
});

document.getElementById('updateKeyBtn').addEventListener('click', async () => {
  const newApiKey = document.getElementById('apiKey').value.trim();
  const errorDiv = document.getElementById('error');
  if (!newApiKey) {
    errorDiv.textContent = 'Please enter a new API key.';
    errorDiv.classList.remove('hidden');
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
      errorDiv.classList.remove('text-red-500', 'hidden');
      errorDiv.classList.add('text-green-500');
    } else {
      errorDiv.textContent = result.error;
      errorDiv.classList.remove('hidden');
      errorDiv.classList.add('text-red-500');
    }
  } catch (error) {
    errorDiv.textContent = 'Error updating API key: ' + error.message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('text-red-500');
  }
});

async function fetchViews(videoId) {
  const errorDiv = document.getElementById('error');
  const viewsSpan = document.getElementById('views');
  const loadingDiv = document.getElementById('loading');
  
  loadingDiv.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  
  try {
    const response = await fetch(`/api/views/${videoId}`);
    const data = await response.json();
    if (response.ok) {
      // Format view count with commas
      viewsSpan.textContent = parseInt(data.viewCount).toLocaleString('en-US');
      loadingDiv.classList.add('hidden');
    } else {
      errorDiv.textContent = data.error;
      errorDiv.classList.remove('hidden');
      loadingDiv.classList.add('hidden');
      if (data.error.includes('Quota exceeded')) {
        isTracking = false;
        document.getElementById('startBtn').textContent = 'Start Tracking';
        document.getElementById('startBtn').classList.remove('bg-red-500', 'hover:bg-red-600');
        document.getElementById('startBtn').classList.add('bg-blue-500', 'hover:bg-blue-600');
        clearInterval(intervalId);
      }
    }
  } catch (error) {
    errorDiv.textContent = 'Error fetching views: ' + error.message;
    errorDiv.classList.remove('hidden');
    loadingDiv.classList.add('hidden');
    isTracking = false;
    document.getElementById('startBtn').textContent = 'Start Tracking';
    document.getElementById('startBtn').classList.remove('bg-red-500', 'hover:bg-red-600');
    document.getElementById('startBtn').classList.add('bg-blue-500', 'hover:bg-blue-600');
    clearInterval(intervalId);
  }
}
