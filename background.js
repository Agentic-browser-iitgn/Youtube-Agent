// Background service worker for YouTube Agent
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Agent extension installed');
});

/**
 * Get OAuth token using chrome.identity API
 * For MV3 with oauth2 in manifest, use getAuthToken instead of launchWebAuthFlow
 */
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    // Check if chrome.identity is available
    if (!chrome.identity) {
      return reject(new Error('chrome.identity API not available'));
    }

    // Use getAuthToken for MV3 when oauth2 is configured in manifest
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('OAuth error:', chrome.runtime.lastError);
        return reject(new Error(chrome.runtime.lastError.message));
      }
      
      if (!token) {
        return reject(new Error('No access token received'));
      }
      
      console.log('OAuth token obtained successfully');
      resolve(token);
    });
  });
}

/**
 * Post comment to YouTube using the Data API
 */
async function postYouTubeComment(videoId, comment) {
  try {
    console.log('Posting comment to video:', videoId);
    const token = await getAccessToken();
    
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            videoId,
            topLevelComment: { 
              snippet: { textOriginal: comment } 
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('YouTube API error:', res.status, body);
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    const result = await res.json();
    console.log('Comment posted successfully:', result);
    return result;
    } catch (err) {
    console.error('Failed to rate video:', err);
    throw new Error(`Failed to rate video: ${err.message}`);
  }
}

/**
 * Search YouTube for videos/channels using the Data API
 * @param {string} query - The search query
 * @param {string} type - 'video', 'channel', or 'all' (default: 'all')
 * @param {number} maxResults - Maximum results to return (default: 10)
 */
async function searchYouTube(query, type = 'all', maxResults = 10) {
  try {
    console.log('Searching YouTube for:', query, 'Type:', type);
    const token = await getAccessToken();
    
    // Build the search URL
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    
    // Add type filter if specified
    if (type === 'video') {
      url += '&type=video';
    } else if (type === 'channel') {
      url += '&type=channel';
    }
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`YouTube API error ${res.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    
    // Format the results
    const results = data.items.map(item => {
      const snippet = item.snippet;
      return {
        type: item.id.kind.replace('youtube#', ''),
        id: item.id.videoId || item.id.channelId,
        title: snippet.title,
        description: snippet.description,
        thumbnail: snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
        channelTitle: snippet.channelTitle,
        channelId: snippet.channelId,
        publishedAt: snippet.publishedAt
      };
    });
    
    console.log(`Found ${results.length} results for "${query}"`);
    return {
      query,
      totalResults: data.pageInfo?.totalResults || results.length,
      results
    };
  } catch (err) {
    console.error('Failed to search YouTube:', err);
    throw new Error(`Failed to search: ${err.message}`);
  }
}

/**
 * Get channel ID from channel name using search
 */
async function getChannelIdByName(channelName) {
}

/**
 * Get or create the "Saved Videos" playlist
 * Returns the playlist ID
 */
async function getSavedVideosPlaylistId() {
  try {
    // Check if we already have the playlist ID stored
    const stored = await chrome.storage.local.get(['savedVideosPlaylistId']);
    if (stored.savedVideosPlaylistId) {
      console.log('Using cached Saved Videos playlist ID:', stored.savedVideosPlaylistId);
      return stored.savedVideosPlaylistId;
    }

    const token = await getAccessToken();

    // Search for existing "Saved Videos" playlist by YouTube Agent
    // We need to check all user playlists to find if one already exists
    console.log('Searching for existing Saved Videos playlist...');
    const listRes = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50',
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!listRes.ok) {
      throw new Error(`Failed to list playlists: ${listRes.status}`);
    }

    const playlists = await listRes.json();
    
    // Look for playlist with our specific title
    // Check both old and new naming conventions for backward compatibility
    const savedPlaylist = playlists.items?.find(
      p => p.snippet.title === 'Saved Videos' || 
           p.snippet.title === 'Saved Videos'
    );

    if (savedPlaylist) {
      // Found existing playlist
      console.log('Found existing Saved Videos playlist:', savedPlaylist.id, '- Title:', savedPlaylist.snippet.title);
      await chrome.storage.local.set({ savedVideosPlaylistId: savedPlaylist.id });
      return savedPlaylist.id;
    }

    // No existing playlist found, create a new one
    console.log('No existing Saved Videos playlist found. Creating new one...');
    const createRes = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: 'Saved Videos',
            description: 'Videos saved via YouTube Agent extension',
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: 'private' // or 'public' / 'unlisted'
          }
        })
      }
    );

    if (!createRes.ok) {
      const body = await createRes.text();
      throw new Error(`Failed to create playlist: ${createRes.status} - ${body}`);
    }

    const newPlaylist = await createRes.json();
    console.log('Created new Saved Videos playlist:', newPlaylist.id);
    
    // Store the playlist ID for future use
    await chrome.storage.local.set({ savedVideosPlaylistId: newPlaylist.id });
    
    return newPlaylist.id;
  } catch (err) {
    console.error('Failed to get/create Saved Videos playlist:', err);
    throw err;
  }
}

/**
 * Verify if a playlist exists
 * @param {string} playlistId - The playlist ID to check
 * @returns {Promise<boolean>} - True if playlist exists, false otherwise
 */
async function verifyPlaylistExists(playlistId) {
  try {
    const token = await getAccessToken();
    
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      console.warn('Playlist verification failed:', res.status);
      return false;
    }

    const data = await res.json();
    return data.items && data.items.length > 0;
  } catch (err) {
    console.warn('Error verifying playlist existence:', err);
    return false;
  }
}

/**
 * Check if video is already in the Saved Videos playlist
 * Note: We need to fetch playlist items and search for the videoId
 * because the API doesn't support filtering by videoId directly
 */
async function isVideoInPlaylist(playlistId, videoId) {
  try {
    const token = await getAccessToken();
    
    // Fetch playlist items (limit to recent 50 to reduce API calls)
    // For a more thorough check, we could paginate through all items
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const errorBody = await res.text();
      
      // If playlist not found (404), return false and let caller handle
      if (res.status === 404) {
        console.warn('Playlist not found (404), will need to recreate');
        return false;
      }
      
      console.warn('Failed to check if video exists in playlist:', res.status, errorBody);
      return false; // Assume not in playlist on error
    }

    const data = await res.json();
    
    // Check if any item has the matching videoId
    if (data.items && data.items.length > 0) {
      const found = data.items.some(item => 
        item.snippet?.resourceId?.videoId === videoId
      );
      if (found) {
        console.log('Video already exists in playlist:', videoId);
      }
      return found;
    }
    
    return false;
  } catch (err) {
    console.warn('Error checking video in playlist:', err);
    return false;
  }
}

/**
 * Save video to "Saved Videos" playlist using YouTube Data API
 * Creates the playlist if it doesn't exist, and avoids duplicates
 * @param {string} videoId - The YouTube video ID
 */
async function saveVideoToWatchLater(videoId) {
  try {
    console.log('Saving video to Saved Videos playlist:', videoId);
    
    // Get or create the Saved Videos playlist
    let playlistId = await getSavedVideosPlaylistId();
    
    // Verify the playlist actually exists (might have been deleted)
    const playlistExists = await verifyPlaylistExists(playlistId);
    if (!playlistExists) {
      console.warn('Cached playlist ID is invalid, clearing and recreating...');
      // Clear the cached playlist ID and get a new one
      await chrome.storage.local.remove('savedVideosPlaylistId');
      playlistId = await getSavedVideosPlaylistId();
    }
    
    // Check if video is already in the playlist
    const alreadyExists = await isVideoInPlaylist(playlistId, videoId);
    if (alreadyExists) {
      console.log('Video already in Saved Videos playlist');
      throw new Error('Video is already in your Saved Videos playlist');
    }

    // Add video to playlist
    const token = await getAccessToken();
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('YouTube API error:', res.status, body);
      
      // Handle playlist not found (404) - playlist might have been deleted
      if (res.status === 404 && body.includes('playlistNotFound')) {
        console.warn('Playlist not found, clearing cached ID and retrying...');
        // Clear the cached playlist ID
        await chrome.storage.local.remove('savedVideosPlaylistId');
        // Retry by getting/creating a new playlist
        playlistId = await getSavedVideosPlaylistId();
        
        // Retry the insert with the new playlist ID
        const retryRes = await fetch(
          'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              snippet: {
                playlistId: playlistId,
                resourceId: {
                  kind: 'youtube#video',
                  videoId: videoId
                }
              }
            }),
          }
        );
        
        if (!retryRes.ok) {
          const retryBody = await retryRes.text();
          throw new Error(`YouTube API error ${retryRes.status}: ${retryBody}`);
        }
        
        const retryResult = await retryRes.json();
        console.log('Video saved to new Saved Videos playlist successfully (after retry):', retryResult);
        return { ...retryResult, playlistId };
      }
      
      // Check for specific error: video already in playlist
      if (res.status === 409 || body.includes('videoAlreadyInPlaylist')) {
        throw new Error('Video is already in your Saved Videos playlist');
      }
      
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    const result = await res.json();
    console.log('Video saved to Saved Videos playlist successfully:', result);
    return { ...result, playlistId };
  } catch (err) {
    console.error('Failed to save video:', err);
    throw new Error(`Failed to save video: ${err.message}`);
  }
}

/**
 * Rate a video (like or dislike) using YouTube Data API
 * @param {string} videoId - The YouTube video ID
 * @param {string} rating - 'like', 'dislike', or 'none' (to remove rating)
 */
async function rateVideo(videoId, rating) {
  try {
    console.log(`Rating video ${videoId} as: ${rating}`);
    
    if (!['like', 'dislike', 'none'].includes(rating)) {
      throw new Error('Invalid rating. Must be "like", "dislike", or "none"');
    }
    
    const token = await getAccessToken();
    
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=${rating}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('YouTube API error:', res.status, body);
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    // API returns 204 No Content on success
    console.log(`Video ${rating}d successfully`);
    
    if (rating === 'like') {
      return { success: true, message: '👍 Video liked successfully!' };
    } else if (rating === 'dislike') {
      return { success: true, message: '👎 Video disliked successfully!' };
    } else {
      return { success: true, message: 'Rating removed' };
    }
  } catch (err) {
    console.error('Failed to rate video:', err);
    throw new Error(`Failed to rate video: ${err.message}`);
  }
}

/**
 * Get channel ID from channel name using search
 * @param {string} channelName - The channel name to search for
 */
async function getChannelIdByName(channelName) {
  try {
    console.log('Searching for channel:', channelName);
    const token = await getAccessToken();
    
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to search channel: ${res.status}`);
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channelId = data.items[0].snippet.channelId;
    const channelTitle = data.items[0].snippet.title;
    
    console.log(`Found channel: ${channelTitle} (${channelId})`);
    return { channelId, channelTitle };
  } catch (err) {
    console.error('Failed to search for channel:', err);
    throw err;
  }
}

/**
 * Get channel ID from video ID
 */
async function getChannelIdFromVideo(videoId) {
  try {
    const token = await getAccessToken();
    
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to get video info: ${res.status}`);
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const channelId = data.items[0].snippet.channelId;
    const channelTitle = data.items[0].snippet.channelTitle;
    
    console.log(`Found channel: ${channelTitle} (${channelId})`);
    return { channelId, channelTitle };
  } catch (err) {
    console.error('Failed to get channel ID:', err);
    throw err;
  }
}

/**
 * Subscribe to a YouTube channel
 * @param {string} channelId - The YouTube channel ID
 */
async function subscribeToChannel(channelId) {
  try {
    console.log('Subscribing to channel:', channelId);
    const token = await getAccessToken();
    
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            resourceId: {
              kind: 'youtube#channel',
              channelId: channelId
            }
          }
        })
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('YouTube API error:', res.status, body);
      
      // Check if already subscribed
      if (res.status === 400 && body.includes('subscriptionDuplicate')) {
        throw new Error('You are already subscribed to this channel');
      }
      
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    const result = await res.json();
    console.log('Subscribed successfully:', result);
    return result;
  } catch (err) {
    console.error('Failed to subscribe:', err);
    throw new Error(`Failed to subscribe: ${err.message}`);
  }
}

/**
 * Single unified message listener for all actions
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Background received message:', msg);

  // Handle API key storage
  if (msg.action === 'getApiKey') {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      sendResponse({ apiKey: result.geminiApiKey || '' });
    });
    return true;
  }
  
  if (msg.action === 'saveApiKey') {
    chrome.storage.local.set({ geminiApiKey: msg.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Handle OAuth token request
  if (msg.action === 'getOAuthToken') {
    getAccessToken()
      .then((token) => {
        sendResponse({ success: true, token });
      })
      .catch((err) => {
        console.error('OAuth token error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle comment posting
  if (msg.action === 'postComment') {
    postYouTubeComment(msg.videoId, msg.comment)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle save to Watch Later
  if (msg.action === 'saveToWatchLater') {
    saveVideoToWatchLater(msg.videoId)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle video rating (like/dislike)
  if (msg.action === 'rateVideo') {
    rateVideo(msg.videoId, msg.rating)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle YouTube search
  if (msg.action === 'searchYouTube') {
    searchYouTube(msg.query, msg.type, msg.maxResults)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle channel subscription
  if (msg.action === 'subscribeToChannel') {
    // Priority 1: If channelId provided, use it directly
    if (msg.channelId) {
      subscribeToChannel(msg.channelId)
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
    }
    // Priority 2: If channelName provided, search for it first
    else if (msg.channelName) {
      getChannelIdByName(msg.channelName)
        .then(({ channelId, channelTitle }) => {
          return subscribeToChannel(channelId).then(data => ({ ...data, channelTitle }));
        })
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
    }
    // Priority 3: If videoId provided, get channel from video
    else if (msg.videoId) {
      getChannelIdFromVideo(msg.videoId)
        .then(({ channelId, channelTitle }) => {
          return subscribeToChannel(channelId).then(data => ({ ...data, channelTitle }));
        })
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
    } else {
      sendResponse({ success: false, error: 'No channelId, channelName, or videoId provided' });
    }
    return true;
  }

  return false;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('youtube.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
  } else {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
  }
});
