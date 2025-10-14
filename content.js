// YouTube Agent Content Script
class YouTubeAgent {
  constructor() {
    this.isOpen = false;
    this.apiKey = '';
    this.init();
  }


  async init() {
    // Load saved API key
    const result = await chrome.storage.local.get(['geminiApiKey']);
    this.apiKey = result.geminiApiKey || '';
    
    this.createUI();
    this.setupEventListeners();
    
    // Add message to indicate extension is ready
    this.addMessage('system', '🤖 YouTube Agent is ready! Set your Gemini API key and start giving commands.');
    
    // Check if there are pending steps to execute after navigation
    await this.checkAndResumePendingSteps();
  }

  /**
   * Check if there are pending steps after page navigation and resume execution
   */
  async checkAndResumePendingSteps() {
    const { pendingSteps, currentStepIndex } = await chrome.storage.local.get(['pendingSteps', 'currentStepIndex']);
    
    if (pendingSteps && pendingSteps.length > 0 && currentStepIndex !== undefined) {
      // Wait a bit for page to be ready
      await this.delay(1000);
      
      this.addMessage('system', '⏳ Resuming multi-step command...');
      
      // Resume execution from the next step
      await this.executeRemainingSteps(pendingSteps, currentStepIndex);
      
      // Clear pending steps
      await chrome.storage.local.remove(['pendingSteps', 'currentStepIndex']);
    }
  }

  /**
   * Execute remaining steps after navigation
   */
  async executeRemainingSteps(steps, startIndex) {
    let results = [];
    let previousPriority = 1; // We just navigated, so previous was Priority 1
    
    // Start from the step after navigation
    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      const { action, parameters, explanation, priority = 2 } = step;
      
      try {
        // Show step progress
        if (steps.length > 1) {
          this.addMessage('system', `⏳ Step ${i + 1}/${steps.length}: ${explanation}`);
        }
        
        // If transitioning from Priority 1 to Priority 2, wait for page to be ready
        if (previousPriority === 1 && priority === 2 && i === startIndex) {
          this.addMessage('system', '⏳ Waiting for page to fully load...');
          await this.waitForVideoPageReady(5000);
        }
        
        let result;
        
        switch (action) {
          case 'like_video':
            result = await this.likeCurrentVideo();
            break;

          case 'save_video':
            result = await this.saveCurrentVideoToWatchLater();
            break;

          case 'comment_video':
            const text = parameters?.text || '';
            const res = await this.postCommentToBackground(text);
            result = `💬 Comment posted (id: ${res.id || 'unknown'})`;
            break;

          case 'dislike_video':
            result = await this.dislikeCurrentVideo();
            break;

          case 'subscribe_channel':
            result = await this.subscribeToChannel(parameters?.channelName);
            break;
            
          default:
            result = `⚠️ Action "${action}" is not yet implemented.`;
        }
        
        results.push(result);
        this.addMessage('agent', result);
        
        // Add delay between steps
        if (i < steps.length - 1 && priority === 2) {
          await this.delay(800);
        }
        
        previousPriority = priority;
        
      } catch (error) {
        const errorMsg = `❌ Step ${i + 1} failed: ${error.message}`;
        results.push(errorMsg);
        this.addMessage('agent', errorMsg);
        continue;
      }
    }
    
    this.addMessage('agent', `✅ Completed ${results.length} steps. All actions finished!`);
  }

  createUI() {
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'youtube-agent-toggle';
    this.toggleButton.innerHTML = '🤖 Agent';
    this.toggleButton.title = 'Open YouTube Agent';
    document.body.appendChild(this.toggleButton);

    // Create sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'youtube-agent-sidebar';
    this.sidebar.innerHTML = `
      <div class="youtube-agent-header">
        <h2 class="youtube-agent-title">🤖 YouTube Agent</h2>
        <button class="youtube-agent-close">&times;</button>
      </div>
      <div class="youtube-agent-content">
        <div class="youtube-agent-api-section">
          <h3>🔑 Gemini API Key</h3>
          <input type="password" class="youtube-agent-api-input" placeholder="Enter your Gemini API key..." value="${this.apiKey}">
          <div class="youtube-agent-api-status">${this.apiKey ? '✅ API key saved' : '⚠️ Please add your Gemini API key'}</div>
        </div>
        
        <div class="youtube-agent-chat">
          <div class="youtube-agent-messages"></div>
          <div class="youtube-agent-input-area">
            <textarea class="youtube-agent-input" placeholder="Type your command... (e.g., 'Play Despacito', 'Subscribe to MrBeast')" rows="1"></textarea>
            <button class="youtube-agent-send">Send</button>
          </div>
        </div>
        
        <div class="youtube-agent-examples">
          <h4>Example Commands</h4>
          <div class="youtube-agent-example">"Play the latest iPhone review"</div>
          <div class="youtube-agent-example">"Like this video"</div>
          <div class="youtube-agent-example">"Save this video"</div>
          <div class="youtube-agent-example">"Comment: Great video!"</div>
          <div class="youtube-agent-example">"Subscribe to MrBeast"</div>
          <div class="youtube-agent-example">"Search for Python tutorials"</div>
          <h5 style="margin-top: 12px; color: #aaa; font-size: 12px;">Multi-Step Commands:</h5>
          <div class="youtube-agent-example">"Play Despacito and like it"</div>
          <div class="youtube-agent-example">"Play Python tutorial for beginners and save it"</div>
        </div>
      </div>
    `;
    document.body.appendChild(this.sidebar);
  }

  setupEventListeners() {
    // Toggle button
    this.toggleButton.addEventListener('click', () => this.toggleSidebar());
    
    // Close button
    this.sidebar.querySelector('.youtube-agent-close').addEventListener('click', () => this.closeSidebar());
    
    // API key input
    const apiInput = this.sidebar.querySelector('.youtube-agent-api-input');
    apiInput.addEventListener('input', (e) => this.saveApiKey(e.target.value));
    
    // Send button and input
    const sendButton = this.sidebar.querySelector('.youtube-agent-send');
    const input = this.sidebar.querySelector('.youtube-agent-input');
    
    sendButton.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    });
    
    // Example commands
    const examples = this.sidebar.querySelectorAll('.youtube-agent-example');
    examples.forEach(example => {
      example.addEventListener('click', () => {
        input.value = example.textContent.replace(/"/g, '');
        input.focus();
      });
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.sidebar.contains(e.target) && !this.toggleButton.contains(e.target)) {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    if (this.isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    this.isOpen = true;
    this.sidebar.classList.add('open');
    this.toggleButton.style.display = 'none';
    
    // Focus on input if API key is set
    if (this.apiKey) {
      setTimeout(() => {
        this.sidebar.querySelector('.youtube-agent-input').focus();
      }, 300);
    }
  }

  closeSidebar() {
    this.isOpen = false;
    this.sidebar.classList.remove('open');
    this.toggleButton.style.display = 'block';
  }

  async saveApiKey(key) {
    this.apiKey = key;
    await chrome.storage.local.set({ geminiApiKey: key });
    
    const status = this.sidebar.querySelector('.youtube-agent-api-status');
    if (key) {
      status.textContent = '✅ API key saved';
      status.className = 'youtube-agent-api-status success';
    } else {
      status.textContent = '⚠️ Please add your Gemini API key';
      status.className = 'youtube-agent-api-status';
    }
  }

  async sendMessage() {
    const input = this.sidebar.querySelector('.youtube-agent-input');
    const sendButton = this.sidebar.querySelector('.youtube-agent-send');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!this.apiKey) {
      this.addMessage('agent', '❌ Please set your Gemini API key first.');
      return;
    }
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';
    
    // Disable input while processing
    sendButton.disabled = true;
    sendButton.innerHTML = '<span class="youtube-agent-loading"></span>';
    
    try {
      // Process the command with AI
      const response = await this.processCommand(message);
      this.addMessage('agent', response);
    } catch (error) {
      console.error('Error processing command:', error);
      this.addMessage('agent', `❌ Error: ${error.message}`);
    } finally {
      sendButton.disabled = false;
      sendButton.innerHTML = 'Send';
    }
  }

  async processCommand(userMessage) {
    try {
      // Call Gemini AI to understand the intent
      const intent = await this.getAIIntent(userMessage);
      
      // Execute the action based on intent
      return await this.executeAction(intent, userMessage);
    } catch (error) {
      throw new Error(`Failed to process command: ${error.message}`);
    }
  }

  async getAIIntent(message) {
    const prompt = `You are a YouTube automation assistant. Analyze this user command and convert it into a sequence of actions with proper ordering.

User command: "${message}"

Available actions with hierarchical priority:
1. NAVIGATION ACTIONS (Priority 1 - Execute first):
   - "search": Search for videos/channels (navigates to search results page)
   - "play_video": Play a video by search term or URL (navigates to video page)

2. VIDEO INTERACTION ACTIONS (Priority 2 - Execute after navigation completes):
   - "like_video": Like the current video
   - "dislike_video": Dislike the current video
   - "save_video": Save the current video to a playlist
   - "comment_video": Post a comment on the current video
   - "subscribe_channel": Subscribe to a channel

CRITICAL ORDERING RULES:
- "search" or "play_video" MUST come BEFORE like/dislike/save/comment actions
- If user says "play X and like it", the order is: [play_video, like_video]
- If user says "play X and save it", the order is: [play_video, save_video]
- If standalone like/dislike/save/comment (without play), they execute on current video
- Multiple interaction actions can follow a single navigation action

IMPORTANT: If the user's request CANNOT be fulfilled with the available actions (e.g., "download video", "change video quality", "create playlist", "edit channel"), return a special response:
{
  "steps": [],
  "fallback": true,
  "explanation": "Provide detailed step-by-step manual instructions on how the user can achieve this task on YouTube"
}

Return JSON format:
{
  "steps": [
    {
      "action": "action_name",
      "priority": 1 or 2,
      "parameters": {
        "query": "search term or channel name",
        "url": "direct URL if provided",
        "text": "comment text",
        "channelName": "channel name for subscribe action"
      },
      "explanation": "Brief explanation of this step"
    }
  ]
}

Examples:

Single-step commands:
- "Play Despacito" → {"steps": [{"action": "play_video", "priority": 1, "parameters": {"query": "Despacito"}, "explanation": "Searching and playing Despacito"}]}
- "Like this video" → {"steps": [{"action": "like_video", "priority": 2, "parameters": {}, "explanation": "Liking the current video"}]}
- "Save this video" → {"steps": [{"action": "save_video", "priority": 2, "parameters": {}, "explanation": "Saving current video to Saved Videos playlist"}]}

Multi-step commands (CORRECT ORDER):
- "Play Python tutorial for beginners and save it" → {"steps": [{"action": "play_video", "priority": 1, "parameters": {"query": "Python tutorial beginners"}, "explanation": "Playing Python tutorial for beginners"}, {"action": "save_video", "priority": 2, "parameters": {}, "explanation": "Saving the video to playlist"}]}
- "Play the latest Python tutorial and like it" → {"steps": [{"action": "play_video", "priority": 1, "parameters": {"query": "Python tutorial latest"}, "explanation": "Playing latest Python tutorial"}, {"action": "like_video", "priority": 2, "parameters": {}, "explanation": "Liking the video"}]}
- "Search for MrBeast videos and subscribe to his channel" → {"steps": [{"action": "search", "priority": 1, "parameters": {"query": "MrBeast"}, "explanation": "Searching for MrBeast videos"}, {"action": "subscribe_channel", "priority": 2, "parameters": {"channelName": "MrBeast"}, "explanation": "Subscribing to MrBeast channel"}]}
- "Play Despacito, like it, save it and comment 'Great song!'" → {"steps": [{"action": "play_video", "priority": 1, "parameters": {"query": "Despacito"}, "explanation": "Playing Despacito"}, {"action": "like_video", "priority": 2, "parameters": {}, "explanation": "Liking the video"}, {"action": "save_video", "priority": 2, "parameters": {}, "explanation": "Saving the video"}, {"action": "comment_video", "priority": 2, "parameters": {"text": "Great song!"}, "explanation": "Commenting on the video"}]}

Fallback examples (unsupported actions):
- "Download this video" → {"steps": [], "fallback": true, "explanation": "To download this video:\n1. Copy the video URL\n2. Go to a YouTube downloader website like y2mate.com or savefrom.net\n3. Paste the URL and select your desired quality\n4. Click download\n\nNote: Downloading videos may violate YouTube's Terms of Service. Consider using YouTube Premium for offline viewing."}
- "Change video quality to 1080p" → {"steps": [], "fallback": true, "explanation": "To change video quality:\n1. Click the Settings (gear) icon in the video player\n2. Select 'Quality'\n3. Choose your desired resolution (1080p, 720p, etc.)\n4. The video will reload at the new quality"}

Remember: ALWAYS put search/play_video FIRST (priority 1), then all other actions SECOND (priority 2). For unsupported actions, use fallback mode.
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  async executeAction(intent, originalMessage) {
    const { steps, fallback, explanation } = intent;
    
    // Handle fallback mode - AI provides manual instructions
    if (fallback === true) {
      // Format the explanation nicely
      const formattedExplanation = explanation || "I don't have a built-in function for this action, but here's how you can do it manually.";
      
      this.addMessage('agent', '💡 **Manual Instructions:**');
      
      // Split explanation into lines and display nicely
      const lines = formattedExplanation.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        this.addMessage('info', line.trim());
      });
      
      return '💡 Please follow the manual instructions above to complete this task.';
    }
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return '❌ Invalid action plan from AI';
    }

    let results = [];
    let previousPriority = 0;
    
    // Execute each step sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const { action, parameters, explanation, priority = 2 } = step;
      
      try {
        // Show step progress for multi-step commands
        if (steps.length > 1) {
          this.addMessage('system', `⏳ Step ${i + 1}/${steps.length}: ${explanation}`);
        }
        
        // If transitioning from Priority 1 (navigation) to Priority 2 (interaction)
        // Add extra delay to ensure page is fully loaded
        if (previousPriority === 1 && priority === 2) {
          this.addMessage('system', '⏳ Waiting for page to fully load...');
          await this.waitForVideoPageReady(5000); // Wait up to 5 seconds for video page
        }
        
        let result;
        
        switch (action) {
          case 'play_video':
            // If there are more steps after this, save them before navigation
            if (i < steps.length - 1) {
              await chrome.storage.local.set({
                pendingSteps: steps,
                currentStepIndex: i + 1
              });
              this.addMessage('agent', '🎬 Navigating to video... (Will continue after page loads)');
            }
            result = await this.playVideo(parameters);
            // Page will reload, execution stops here
            return result;
            
          case 'search':
            // If there are more steps after this, save them before navigation
            if (i < steps.length - 1) {
              await chrome.storage.local.set({
                pendingSteps: steps,
                currentStepIndex: i + 1
              });
              this.addMessage('agent', '🔍 Navigating to search results... (Will continue after page loads)');
            }
            result = await this.searchYoutube(parameters);
            // Page will reload, execution stops here
            return result;
            
          case 'like_video':
            result = await this.likeCurrentVideo();
            break;

          case 'save_video':
            result = await this.saveCurrentVideoToWatchLater();
            break;

          case 'comment_video':
            const text = (parameters && parameters.text) ? parameters.text : originalMessage;
            const res = await this.postCommentToBackground(text);
            result = `💬 Comment posted (id: ${res.id || 'unknown'})`;
            break;

          case 'dislike_video':
            result = await this.dislikeCurrentVideo();
            break;

          case 'subscribe_channel':
            result = await this.subscribeToChannel(parameters?.channelName);
            break;
            
          default:
            result = `⚠️ Action "${action}" is not yet implemented.`;
        }
        
        results.push(result);
        
        // For multi-step commands, show intermediate results
        if (steps.length > 1) {
          this.addMessage('agent', result);
        }
        
        // Add delay between steps based on action type
        if (i < steps.length - 1) {
          // Shorter delay between Priority 2 actions (already on same page)
          if (priority === 2) {
            await this.delay(800); // 800ms between like/save/comment actions
          }
        }
        
        previousPriority = priority;
        
      } catch (error) {
        const errorMsg = `❌ Step ${i + 1} failed: ${error.message}`;
        results.push(errorMsg);
        
        if (steps.length > 1) {
          this.addMessage('agent', errorMsg);
        }
        
        // Decide whether to continue or stop on error
        // For now, we'll continue with remaining steps
        continue;
      }
    }
    
    // For single-step commands, return the result
    // For multi-step commands, return a summary
    if (steps.length === 1) {
      return results[0];
    } else {
      return `✅ Completed ${results.length} steps. Check messages above for details.`;
    }
  }

  /**
   * Helper to add delay between steps
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for video page to be ready (URL contains video ID and page is loaded)
   * This is more robust than just waiting for navigation
   */
  async waitForVideoPageReady(timeout = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const currentUrl = window.location.href;
        const hasVideoId = currentUrl.includes('/watch?v=') || currentUrl.includes('youtu.be/');
        const isPageReady = document.readyState === 'complete';
        
        // Check if we're on a video page and it's loaded
        if (hasVideoId && isPageReady) {
          clearInterval(checkInterval);
          // Add small extra delay to ensure video player is initialized
          setTimeout(() => resolve(), 1000);
          return;
        }
        
        // Timeout fallback
        if (Date.now() - startTime >= timeout) {
          clearInterval(checkInterval);
          resolve(); // Continue anyway after timeout
        }
      }, 200); // Check every 200ms
    });
  }

  /**
   * Wait for navigation to complete (for play_video and search actions)
   * @deprecated - Use waitForVideoPageReady for more reliable page load detection
   */
  waitForNavigation(timeout = 3000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        // Check if enough time has passed or page has loaded
        if (Date.now() - startTime >= timeout || document.readyState === 'complete') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  async playVideo(parameters) {
    const { query, url } = parameters;
    
    if (url && url.includes('youtube.com')) {
      // Direct URL provided - navigate to it on same tab
      window.location.href = url;
      return `🎬 Playing video: ${url}`;
    } else if (query) {
      // Search for video using YouTube Data API and play the first result
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { 
              action: 'searchYouTube', 
              query: query,
              type: 'video',
              maxResults: 1 
            },
            (response) => {
              if (!response) {
                reject(new Error('No response from background script'));
                return;
              }
              
              if (response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response.error));
              }
            }
          );
        });

        if (response.results && response.results.length > 0) {
          const firstVideo = response.results[0];
          const videoUrl = `https://www.youtube.com/watch?v=${firstVideo.id}`;
          
          // Navigate to the video
          window.location.href = videoUrl;
          
          return `🎬 Playing: "${firstVideo.title}" by ${firstVideo.channelTitle}`;
        } else {
          return `❌ No videos found for "${query}". Try a different search term.`;
        }
      } catch (error) {
        throw new Error(`Failed to search and play: ${error.message}`);
      }
    } else {
      throw new Error('No video query or URL provided');
    }
  }

  async searchYoutube(parameters) {
    const { query } = parameters;
    if (!query) throw new Error('No search query provided');
    
    // Navigate to YouTube's search results page
    // YouTube's SPA will handle this without a full page reload if already on YouTube
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
    
    return `🔍 Navigating to search results for "${query}"`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Extracts video ID from typical YouTube watch URLs
   */
  getVideoIdFromUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube")) {
        // /watch?v=ID
        const v = u.searchParams.get("v");
        if (v) return v;

        // youtu.be/ID
        const path = u.pathname.split("/");
        if (path.length >= 2 && path[1]) return path[1];
      }
    } catch (e) {}
    return null;
  }

  async postCommentToBackground(comment) {
    const videoId = this.getVideoIdFromUrl(window.location.href);
    if (!videoId) throw new Error("❌ Not a YouTube video page.");

    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getOAuthToken" }, (res) => resolve(res));
    });

    if (!response) throw new Error("No response from background");
    if (!response.success) throw new Error(response.error);

    const token = response.token;

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            videoId,
            topLevelComment: { snippet: { textOriginal: comment } },
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API error ${res.status}: ${body}`);
    }

    return res.json();
  }



  /**
   * Click the 'Save' / 'Watch later' button on the video page as a fallback
   */
  /**
   * Save video to "Saved Videos" playlist using YouTube Data API
   * Creates a custom playlist if it doesn't exist (Watch Later API is not supported)
   * This is more robust than DOM manipulation
   */
  async saveCurrentVideoToWatchLater() {
    try {
      // Get video ID from current page URL
      const videoId = this.getVideoIdFromUrl(window.location.href);
      
      if (!videoId) {
        return '❌ Could not determine video ID. Make sure you\'re on a video page.';
      }

      // Send message to background script to save via API
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'saveToWatchLater', videoId },
          (response) => {
            if (!response) {
              reject(new Error('No response from background script'));
              return;
            }
            
            if (response.success) {
              resolve(`🔖 Video saved to "Saved Videos" playlist! (ID: ${videoId})`);
            } else {
              // Check for specific error messages
              if (response.error.includes('already in your Saved Videos')) {
                resolve(`ℹ️ Video is already in your "Saved Videos" playlist.`);
              } else {
                reject(new Error(response.error));
              }
            }
          }
        );
      });
    } catch (err) {
      return `❌ Failed to save video: ${err.message}`;
    }
  }

  /**
   * Like the current video using YouTube Data API
   * More reliable than DOM manipulation
   */
  async likeCurrentVideo() {
    try {
      const videoId = this.getVideoIdFromUrl(window.location.href);
      
      if (!videoId) {
        return '❌ Could not determine video ID. Make sure you\'re on a video page.';
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'rateVideo', videoId, rating: 'like' },
          (response) => {
            if (!response) {
              reject(new Error('No response from background script'));
              return;
            }
            
            if (response.success) {
              resolve(response.data.message || '👍 Video liked successfully!');
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    } catch (err) {
      return `❌ Failed to like video: ${err.message}`;
    }
  }

  /**
   * Dislike the current video using YouTube Data API
   * More reliable than DOM manipulation
   */
  async dislikeCurrentVideo() {
    try {
      const videoId = this.getVideoIdFromUrl(window.location.href);
      
      if (!videoId) {
        return '❌ Could not determine video ID. Make sure you\'re on a video page.';
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'rateVideo', videoId, rating: 'dislike' },
          (response) => {
            if (!response) {
              reject(new Error('No response from background script'));
              return;
            }
            
            if (response.success) {
              resolve(response.data.message || '👎 Video disliked successfully!');
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    } catch (err) {
      return `❌ Failed to dislike video: ${err.message}`;
    }
  }

  /**
   * Subscribe to a channel using YouTube Data API
   * Can subscribe to current video's channel or search for a channel by name
   */
  async subscribeToChannel(channelNameOrId) {
    try {
      // If channel name/ID is provided, search for it
      if (channelNameOrId) {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'subscribeToChannel', channelName: channelNameOrId },
            (response) => {
              if (!response) {
                reject(new Error('No response from background script'));
                return;
              }
              
              if (response.success) {
                const channelTitle = response.data.channelTitle || channelNameOrId;
                resolve(`✅ Subscribed to ${channelTitle}!`);
              } else {
                if (response.error.includes('already subscribed')) {
                  resolve(`ℹ️ You are already subscribed to this channel.`);
                } else if (response.error.includes('Channel not found')) {
                  reject(new Error(`Channel "${channelNameOrId}" not found. Please check the name and try again.`));
                } else {
                  reject(new Error(response.error));
                }
              }
            }
          );
        });
      }
      
      // If no channel specified, subscribe to current video's channel
      const videoId = this.getVideoIdFromUrl(window.location.href);
      
      if (!videoId) {
        return '❌ Not on a video page. Please specify a channel name or go to a video.';
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'subscribeToChannel', videoId },
          (response) => {
            if (!response) {
              reject(new Error('No response from background script'));
              return;
            }
            
            if (response.success) {
              const channelTitle = response.data.channelTitle || 'this channel';
              resolve(`✅ Subscribed to ${channelTitle}!`);
            } else {
              if (response.error.includes('already subscribed')) {
                resolve(`ℹ️ You are already subscribed to this channel.`);
              } else {
                reject(new Error(response.error));
              }
            }
          }
        );
      });
      
    } catch (err) {
      return `❌ Failed to subscribe: ${err.message}`;
    }
  }

  // Keep the old DOM-based functions as fallback (commented out)
  /*
  findLikeButton() {
    // Common patterns for like button (ARIA labels, button order, segmented wrappers)
    const selectors = [
      'button[aria-label^="like this video"]',
      'button[aria-label*="like this video"]',
      'like-button-renderer button',
      'yt-like-button-renderer button',
      '#top-level-buttons ytd-toggle-button-renderer:nth-child(1) button',
      '#top-level-buttons-computed ytd-toggle-button-renderer:nth-child(1) button',
      'ytd-toggle-button-renderer:nth-of-type(1) button'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && this.isElementVisible(el)) return el;
    }

    // Try more specific traversal inside the segmented wrapper
    const seg = document.querySelector('.ytSegmentedLikeDislikeButtonViewModelSegmentedButtonsWrapper, #top-level-buttons-computed');
    if (seg) {
      // like button is often the first child button
      const maybe = seg.querySelector('button[aria-pressed], button');
      if (maybe && this.isElementVisible(maybe) && /like/i.test(maybe.getAttribute('aria-label') || '')) return maybe;
    }

    return null;
  }

  findDislikeButton() {
    const selectors = [
      'button[aria-label^="Dislike this video" i]',
      'button[aria-label^="dislike this video"]',
      'button[aria-label*="Dislike this video" i]',
      'button[aria-label*="dislike this video"]',
      'ytd-toggle-button-renderer:nth-of-type(2) button',
      '#top-level-buttons ytd-toggle-button-renderer:nth-child(2) button'
    ];

    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && this.isElementVisible(el)) return el;
      } catch (e) {
        // some selectors with i flag may not be supported by older engines; ignore
      }
    }

    const seg = document.querySelector('.ytSegmentedLikeDislikeButtonViewModelSegmentedButtonsWrapper, #top-level-buttons-computed');
    if (seg) {
      const buttons = seg.querySelectorAll('button');
      if (buttons && buttons.length >= 2 && this.isElementVisible(buttons[1])) return buttons[1];
    }

    return null;
  }
  */

  addMessage(type, content) {
    const messagesContainer = this.sidebar.querySelector('.youtube-agent-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `youtube-agent-message ${type}`;
    
    // For info messages (manual instructions), use special formatting
    if (type === 'info') {
      messageElement.innerHTML = this.formatInfoMessage(content);
    } else {
      messageElement.textContent = content;
    }
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Format info messages with better styling for manual instructions
   */
  formatInfoMessage(content) {
    // Escape HTML but preserve formatting
    const escaped = content.replace(/&/g, '&amp;')
                           .replace(/</g, '&lt;')
                           .replace(/>/g, '&gt;');
    
    // Format numbered lists
    if (/^\d+\./.test(escaped)) {
      return `<span class="step-number">${escaped}</span>`;
    }
    
    // Format notes/warnings
    if (/^(Note:|Warning:|Tip:)/i.test(escaped)) {
      return `<span class="note-text">${escaped}</span>`;
    }
    
    return escaped;
  }
}

// Initialize the YouTube Agent when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new YouTubeAgent();
  });
} else {
  new YouTubeAgent();
}