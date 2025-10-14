# YouTube Agent - AI-Powered Browser Extension

A powerful browser extension that automates YouTube interactions through natural language commands. This agent can play videos, like/dislike videos, search content, and much more using AI-powered intent recognition!

## 🚀 Features

- **Video Playback**: Play any video by name or direct URL in new tabs
- **Video Interactions**: Like and dislike videos
- **Smart Search**: Search for videos and content
- **AI-Powered Intent Recognition**: Understands natural language commands using Google Gemini AI 2.0 flash model
- **Seamless Integration**: Works directly on YouTube.com with a beautiful sidebar interface
- **No Storage Required**: Chat history is not saved, ensuring privacy

## 🎯 How It Works

1. **Toggle Button**: When on YouTube.com, look for the red "🤖 Agent" button on the right side
2. **Side Chat Bar**: Click the button to open an elegant chat sidebar
3. **API Configuration**: Add your Gemini API key directly in the extension
4. **Natural Commands**: Give voice commands and let AI understand your intent
5. **Instant Actions**: Watch as the agent performs YouTube actions automatically

## 💬 Example Commands

The agent understands natural language commands:

### 🎬 Play Commands:
- "Play Despacito on YouTube"
- "Watch the latest iPhone review" 
- "Open https://youtube.com/watch?v=dQw4w9WgXcQ"

### � Interaction Commands:
- "Like this video"
- "Dislike this video"
- "Give this video a thumbs up"

### 🔍 Search Commands:
- "Search for Python tutorials"
- "Find funny cat videos"
- "Look for music videos"

## 🛠️ Technical Architecture

- **Browser Extension**: Chrome/Edge compatible browser extension
- **Content Script**: Injects UI and automation into YouTube pages
- **AI Integration**: Uses Google Gemini AI for natural language processing
- **Real-time Actions**: Executes YouTube automation in real-time
- **Privacy-First**: No data storage, all processing happens locally

## 📦 Installation

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

## 🔧 Project Structure

```
youtube_agent/
├── manifest.json          # Extension manifest
├── content.js             # Main extension logic
├── background.js          # Service worker
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── styles.css            # Extension styling
├── icons/                # Extension icons
├── README.md             # This file
└── INSTALLATION.md       # Setup guide
```

## 🚀 Quick Start

1. Install the extension (see INSTALLATION.md)
2. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Go to YouTube.com
4. Click the "🤖 Agent" button
5. Enter your API key
6. Start giving commands!

## ⚡ Features in Detail

### AI-Powered Command Processing
The extension uses Google's Gemini AI to understand natural language and convert it into actionable YouTube commands.

### Seamless YouTube Integration  
Works directly on YouTube.com with no external tools needed. The extension integrates seamlessly with YouTube's interface.

### Beautiful User Interface
- Modern gradient design matching YouTube's aesthetic
- Smooth animations and transitions
- Responsive chat interface
- Example commands for easy getting started