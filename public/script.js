let isTracking = false;
let intervalId = null;
let previousViewCount = null;

function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    let videoId = null;

    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.split('/')[1];
    }

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function loadVideos() {
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const select = document.getElementById('videoSelect');
  select.innerHTML = '<option value="">Select a video</option>';
  videos.forEach(video => {
    const option = document.createElement('option');
    option.value = video.url;
    option.textContent = video.name;
    select.appendChild(option);
  });
}

async function fetchVideoTitle(videoId) {
  try {
    const response = await fetch(`/api/title/${videoId}`);
    const data = await response.json();
    if (response.ok) {
      return data.title;
    }
    return 'Untitled Video';
  } catch (error) {
    return 'Untitled Video';
  }
}

document.getElementById('addVideoBtn').addEventListener('click', async () => {
  const url = document.getElementById('videoUrl').value.trim();
  let name = document.getElementById('videoName').value.trim();
  const errorDiv = document.getElementById('error');
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    errorDiv.textContent = 'Please enter a valid YouTube video URL.';
    errorDiv.classList.remove('hidden');
    return;
  }
  if (!name) {
    name = await fetchVideoTitle(videoId);
  }

  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  if (!videos.some(v => v.url === url)) {
    videos.push({ url, name });
    localStorage.setItem('videos', JSON.stringify(videos));
    loadVideos();
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoName').value = '';
    errorDiv.textContent = 'Video added successfully!';
    errorDiv.classList.remove('text-red-500', 'hidden');
    errorDiv.classList.add('text-green-500');
  } else {
    errorDiv.textContent = 'Video URL already exists.';
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('text-red-500');
  }
});

document.getElementById('videoSelect').addEventListener('change', () => {
  if (isTracking) {
    isTracking = false;
    document.getElementById('startBtn').textContent = 'Start Tracking';
    document.getElementById('startBtn').classList.remove('bg-red-500', 'hover:bg-red-600');
    document.getElementById('startBtn').classList.add('bg-blue-500', 'hover:bg-blue-600');
    clearInterval(intervalId);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('viewIncrease').classList.add('hidden');
  }
  document.getElementById('views').textContent = '0';
  previousViewCount = null;
});

document.getElementById('startBtn').addEventListener('click', () => {
  const url = document.getElementById('videoSelect').value;
  const errorDiv = document.getElementById('error');
  const loadingDiv = document.getElementById('loading');
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    errorDiv.textContent = 'Please select a video from the dropdown.';
    errorDiv.classList.remove('hidden');
    return;
  }

  if (!isTracking) {
    isTracking = true;
    previousViewCount = null;
    document.getElementById('startBtn').textContent = 'Stop Tracking';
    document.getElementById('startBtn').classList.remove('bg-blue-500', 'hover:bg-blue-600');
    document.getElementById('startBtn').classList.add('bg-red-500', 'hover:bg-red-600');
    errorDiv.classList.add('hidden');
    document.getElementById('viewIncrease').classList.add('hidden');
    fetchViews(videoId);
    intervalId = setInterval(() => fetchViews(videoId), 50); // Fetch every 10ms
  } else {
    isTracking = false;
    document.getElementById('startBtn').textContent = 'Start Tracking';
    document.getElementById('startBtn').classList.remove('bg-red-500', 'hover:bg-red-600');
    document.getElementById('startBtn').classList.add('bg-blue-500', 'hover:bg-blue-600');
    clearInterval(intervalId);
    loadingDiv.classList.add('hidden');
    document.getElementById('viewIncrease').classList.add('hidden');
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
    errorDiv.textContent = 'Error adding API key: ' + error.message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('text-red-500');
  }
});

async function fetchViews(videoId) {
  const errorDiv = document.getElementById('error');
  const viewsSpan = document.getElementById('views');
  const viewIncreaseDiv = document.getElementById('viewIncrease');
  const loadingDiv = document.getElementById('loading');
  
  loadingDiv.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  
  try {
    const response = await fetch(`/api/views/${videoId}`);
    const data = await response.json();
    if (response.ok) {
      const currentViewCount = parseInt(data.viewCount);
      viewsSpan.textContent = currentViewCount.toLocaleString('en-US');

      if (previousViewCount !== null && currentViewCount > previousViewCount) {
        const increase = currentViewCount - previousViewCount;
        viewIncreaseDiv.textContent = `+${increase.toLocaleString('en-US')}`;
        viewIncreaseDiv.classList.remove('hidden');
        viewIncreaseDiv.classList.add('animate-pulse');
        setTimeout(() => viewIncreaseDiv.classList.remove('animate-pulse'), 1000);
      }
      previousViewCount = currentViewCount;

      loadingDiv.classList.add('hidden');
    } else {
      errorDiv.textContent = data.error;
      errorDiv.classList.remove('hidden');
      loadingDiv.classList.add('hidden');
      if (data.error.includes('Quota exceeded') || data.error.includes('All API keys')) {
        isTracking = false;
        document.getElementById('startBtn').textContent = 'Start Tracking';
        document.getElementById('startBtn').classList.remove('bg-red-500', 'hover:bg-red-600');
        document.getElementById('startBtn').classList.add('bg-blue-500', 'hover:bg-blue-600');
        clearInterval(intervalId);
        viewIncreaseDiv.classList.add('hidden');
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
    viewIncreaseDiv.classList.add('hidden');
  }
}

// Load videos on page load
document.addEventListener('DOMContentLoaded', loadVideos);
