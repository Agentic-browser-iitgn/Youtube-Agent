# YouTube Agent - AI-Powered Browser Extension 🤖✨

A powerful browser extension that automates YouTube interactions through natural language commands. This agent can play videos, like/dislike videos, search content, subscribe to channels, and much more using AI-powered intent recognition with **AI Fallback Support**!

## 🆕 What's New in This Version

### AI Fallback System
When you ask for something the extension can't do directly, it provides **step-by-step manual instructions**:
- "Download this video" → AI provides safe download instructions
- "Change video quality to 1080p" → AI explains how to adjust quality settings
- "Create a new playlist" → AI guides you through playlist creation
- "Enable dark mode" → AI shows you where the settings are

### Improved UI/UX
- ✨ **Modern Design**: Beautiful gradient animations and smooth transitions
- 🎨 **Better Toggle Button**: Eye-catching floating button at bottom-right (no longer mid-screen!)
- 📱 **Responsive Layout**: Works great on different screen sizes
- 🎭 **Enhanced Animations**: Smooth slide-ins, hover effects, and micro-interactions

## 🚀 Features

### Core Functionality
- **🎬 Video Playback**: Play any video by name or direct URL
- **👍 Video Interactions**: Like, dislike, and save videos to playlists
- **💬 Comment Posting**: Post comments on videos using voice commands
- **🔔 Channel Subscriptions**: Subscribe to channels automatically
- **🔍 Smart Search**: Search for videos and content
- **🔗 Multi-Step Automation**: Execute complex command sequences

### AI-Powered Intelligence
- **Natural Language Understanding**: Uses Google Gemini AI 2.0 flash model
- **Intent Recognition**: Understands context and user intent
- **🆕 AI Fallback System**: Provides manual instructions for unsupported actions
- **Smart Command Sequencing**: Automatically orders navigation and interaction actions

### User Experience
- **✨ Modern UI**: Beautiful, animated sidebar with gradient designs
- **🎨 Improved Toggle Button**: Floating button with smooth animations
- **💾 Privacy First**: Chat history is not saved
- **⚡ Real-time Execution**: Instant action without unnecessary page reloads

## 🎯 How It Works

1. **Toggle Button**: When on YouTube.com, look for the floating "🤖 Agent" button at the bottom-right corner
2. **Side Chat Bar**: Click the button to open an elegant chat sidebar
3. **API Configuration**: Add your Gemini API key in the extension popup or sidebar
4. **Natural Commands**: Type commands and let AI understand your intent
5. **Instant Actions**: Watch as the agent performs YouTube actions automatically
6. **AI Assistance**: Get manual instructions for unsupported actions via AI fallback

## 💬 Example Commands

### 🎬 Single Actions:
```
- "Play Despacito"
- "Like this video"
- "Save this video"
- "Subscribe to MrBeast"
- "Comment: Great video!"
- "Search for Python tutorials"
```

### 🔗 Multi-Step Commands:
```
- "Play Python tutorial for beginners and save it"
- "Play Despacito and like it"
- "Search for MrBeast videos and subscribe to his channel"
- "Play the latest iPhone review, like it, and save it"
```

### 💡 AI Fallback Examples (Unsupported Actions):
When you ask for something the extension can't do directly, AI provides guidance:

**User**: "Download this video"  
**AI Response**: Provides step-by-step instructions on safe download methods

**User**: "Change video quality to 1080p"  
**AI Response**: Explains how to adjust quality in the video player settings

**User**: "Create a new playlist called 'Favorites'"  
**AI Response**: Guides you through YouTube's playlist creation process

**User**: "Turn on captions"  
**AI Response**: Shows you where the caption button is located

## 🛠️ Technical Architecture

- **Browser Extension**: Chrome/Edge compatible (Manifest V3)
- **Content Script**: Injects UI and automation into YouTube pages
- **Background Service Worker**: Handles YouTube Data API OAuth and requests
- **AI Integration**: Uses Google Gemini 2.0 Flash for natural language processing
- **YouTube Data API**: For reliable like/dislike/save/comment/subscribe operations
- **Smart Navigation**: Handles page navigation and multi-step command execution
- **Fallback System**: AI generates helpful manual instructions for unsupported actions
- **Privacy-First**: No data storage, all processing happens locally

## 📦 Installation

### From Source:
1. Clone this repository
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `youtube_agent` folder
6. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
7. Click the extension icon and enter your API key
8. Visit YouTube and start using the agent!

## 🔧 Project Structure

```
youtube_agent/
├── manifest.json          # Extension manifest (Manifest V3)
├── content.js             # Main extension logic & UI
├── background.js          # Service worker & API handler
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── styles.css            # Beautiful modern styling
└── README.md             # Documentation
```

## 🚀 Quick Start

1. Install the extension
2. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Click the extension icon and enter your API key
4. Go to YouTube.com
5. Click the "🤖 Agent" button at bottom-right
6. Start giving commands!

## 🎨 UI Improvements

### Before → After
- **Toggle Button**: Mid-screen sticky → Bottom-right floating with animations
- **Sidebar**: Basic dark → Modern gradient with glassmorphism
- **Messages**: Plain boxes → Styled bubbles with animations
- **Input Area**: Simple → Elegant with rounded corners and focus effects
- **Examples**: Plain text → Interactive hover cards
- **Colors**: Basic red → Multi-layer gradients with shadows

## ⚡ Features in Detail

### 1. AI-Powered Command Processing
Uses Google's Gemini AI to understand natural language and convert it into actionable YouTube commands with intelligent fallback.

### 2. Multi-Step Command Execution
Handles complex sequences like "Play X and like it" by automatically:
- Navigating to the video (Priority 1)
- Waiting for page load
- Performing the action (Priority 2)

### 3. Fallback Intelligence System
When a command can't be executed:
- AI analyzes the intent
- Generates step-by-step instructions
- Displays them in a user-friendly format
- Provides context and warnings when needed

### 4. Seamless YouTube Integration
Works directly on YouTube.com with no external tools needed. Integrates seamlessly with YouTube's interface using the official API.

### 5. Beautiful User Interface
- Modern gradient design matching YouTube's aesthetic
- Smooth animations and transitions
- Responsive chat interface with custom scrollbars
- Interactive example commands
- Status indicators and loading states

## 📝 API Keys Required

1. **Gemini API Key**: For AI-powered command understanding
   - Get it from: https://makersuite.google.com/app/apikey
   - Free tier available

2. **YouTube OAuth**: Configured in manifest for API actions
   - Like/dislike videos
   - Save to playlists
   - Subscribe to channels
   - Post comments

## 🔒 Privacy & Security

- ✅ No data collection or storage
- ✅ API keys stored locally only
- ✅ No external servers (except Google APIs)
- ✅ Open source and transparent
- ✅ Manifest V3 security standards

## 🐛 Troubleshooting

**Toggle button not appearing?**
- Make sure you're on youtube.com
- Refresh the page
- Check if extension is enabled

**Commands not working?**
- Verify API key is entered
- Check browser console for errors
- Make sure you're signed into YouTube for OAuth actions

**AI fallback not showing?**
- Ensure Gemini API key is valid
- Check internet connection
- Try rephrasing your command

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

- Built with Google Gemini AI 2.0 Flash
- Uses YouTube Data API v3
- Inspired by modern YouTube automation needs

---

**Made with ❤️ by developers who love automation**

*Note: This extension is not affiliated with YouTube or Google. Use responsibly and in accordance with YouTube's Terms of Service.*
