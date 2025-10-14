# Testing Guide for YouTube Agent v2.0

## 🧪 Pre-Testing Checklist

- [ ] Extension is loaded in Chrome/Edge
- [ ] Gemini API key is configured
- [ ] YouTube OAuth is working
- [ ] You're signed into YouTube

## 🎯 Test Cases

### 1. UI/UX Tests

#### Test 1.1: Toggle Button Appearance
**Steps:**
1. Go to youtube.com
2. Look at bottom-right corner

**Expected:**
- ✅ Button appears at bottom-right (not mid-screen)
- ✅ Button says "🤖 Agent"
- ✅ Button has red gradient background
- ✅ Button has shadow and looks modern

#### Test 1.2: Toggle Button Animation
**Steps:**
1. Hover over the toggle button
2. Click the button
3. Click outside to close

**Expected:**
- ✅ Hover: Button scales up slightly with enhanced shadow
- ✅ Click: Button disappears, sidebar slides in from right
- ✅ Close: Sidebar slides out, button reappears

#### Test 1.3: Sidebar Appearance
**Steps:**
1. Open the sidebar
2. Examine the layout

**Expected:**
- ✅ Sidebar is 450px wide
- ✅ Dark gradient background (not plain)
- ✅ Red gradient header at top
- ✅ API key section visible
- ✅ Chat area visible
- ✅ Examples section at bottom

#### Test 1.4: Message Animations
**Steps:**
1. Send a message "Hello"
2. Watch the messages appear

**Expected:**
- ✅ User message slides in from bottom
- ✅ Agent message slides in from bottom
- ✅ Messages have different colors (user: red, agent: gray)
- ✅ Messages have rounded corners and shadows

### 2. AI Fallback Tests

#### Test 2.1: Download Request (Fallback)
**Steps:**
1. Open agent sidebar
2. Type: "Download this video"
3. Send

**Expected:**
- ✅ AI responds with fallback message
- ✅ Message shows "💡 Manual Instructions:"
- ✅ Step-by-step instructions appear in blue info boxes
- ✅ Instructions include warnings about ToS
- ✅ Steps are numbered and formatted nicely

#### Test 2.2: Quality Change (Fallback)
**Steps:**
1. Type: "Change video quality to 1080p"
2. Send

**Expected:**
- ✅ AI provides manual instructions
- ✅ Instructions explain where to find settings gear icon
- ✅ Steps mention quality selection
- ✅ Formatted with info message styling

#### Test 2.3: Playlist Creation (Fallback)
**Steps:**
1. Type: "Create a new playlist called Favorites"
2. Send

**Expected:**
- ✅ AI provides playlist creation steps
- ✅ Instructions guide through YouTube UI
- ✅ Clear step-by-step format

#### Test 2.4: Other Unsupported Actions
Try these and verify you get helpful instructions:
- "Enable captions"
- "Turn on dark mode"
- "Adjust playback speed to 1.5x"
- "Skip to 2:30 in the video"

### 3. Supported Command Tests

#### Test 3.1: Play Video
**Steps:**
1. Type: "Play Despacito"
2. Send

**Expected:**
- ✅ Agent searches for video
- ✅ Page navigates to first result
- ✅ Video starts playing

#### Test 3.2: Like Video
**Steps:**
1. Navigate to any video
2. Type: "Like this video"
3. Send

**Expected:**
- ✅ Agent likes the video via API
- ✅ Success message appears
- ✅ Like button on page turns active

#### Test 3.3: Multi-Step Command
**Steps:**
1. Type: "Play Python tutorial and like it"
2. Send

**Expected:**
- ✅ Agent navigates to video (step 1)
- ✅ Shows "waiting for page to load" message
- ✅ After load, likes the video (step 2)
- ✅ Success messages for both steps

#### Test 3.4: Subscribe
**Steps:**
1. Type: "Subscribe to MrBeast"
2. Send

**Expected:**
- ✅ Agent searches for channel
- ✅ Subscribes via API
- ✅ Success message appears

### 4. Popup Tests

#### Test 4.1: Popup Appearance
**Steps:**
1. Click extension icon in toolbar
2. Examine popup

**Expected:**
- ✅ Width is 380px (not 350px)
- ✅ Animated logo bounces
- ✅ Red gradient header
- ✅ Modern section styling
- ✅ Feature list has checkmark badges
- ✅ "NEW" badge visible on features

#### Test 4.2: Popup Interactions
**Steps:**
1. Hover over sections
2. Enter API key
3. Click "Open YouTube" button

**Expected:**
- ✅ Sections have hover effects (lift up, change border)
- ✅ API key saves automatically
- ✅ Status updates to green checkmark
- ✅ Button opens YouTube in new tab

### 5. Edge Cases

#### Test 5.1: Empty Command
**Steps:**
1. Try to send empty message

**Expected:**
- ✅ Nothing happens (button disabled or no action)

#### Test 5.2: No API Key
**Steps:**
1. Remove API key
2. Try sending command

**Expected:**
- ✅ Error message: "Please set your Gemini API key first"

#### Test 5.3: Invalid Command
**Steps:**
1. Type: "asdjfklasdjfklajsdf"
2. Send

**Expected:**
- ✅ AI attempts to interpret or provides fallback
- ✅ No crash or blank response

#### Test 5.4: Long Instructions
**Steps:**
1. Type: "How do I become a YouTuber?"
2. Send

**Expected:**
- ✅ AI provides detailed fallback instructions
- ✅ Scrollable message area handles long content
- ✅ Formatting stays intact

## 🎨 Visual Checklist

Compare your extension to these criteria:

### Toggle Button:
- [ ] Located at bottom-right corner
- [ ] Has smooth shadow
- [ ] Animates on hover
- [ ] Slides in on page load

### Sidebar:
- [ ] Slides in smoothly from right
- [ ] 450px wide
- [ ] Dark gradient background
- [ ] Red header with proper styling
- [ ] Custom scrollbars (red theme)

### Messages:
- [ ] User messages: red gradient, right-aligned
- [ ] Agent messages: dark gray, left-aligned
- [ ] System messages: green, centered, italic
- [ ] Info messages: blue border-left, special formatting
- [ ] All messages slide in with animation

### Popup:
- [ ] 380px wide
- [ ] Animated bouncing logo
- [ ] Sections lift on hover
- [ ] Feature list has circular checkmarks
- [ ] "NEW" badge visible
- [ ] Button has smooth hover effect

## 📊 Test Results Template

```
Date: [DATE]
Tester: [NAME]

UI/UX Tests:
- Toggle Button: ✅ / ❌
- Sidebar: ✅ / ❌
- Animations: ✅ / ❌
- Popup: ✅ / ❌

AI Fallback Tests:
- Download Request: ✅ / ❌
- Quality Change: ✅ / ❌
- Playlist Creation: ✅ / ❌
- Other Commands: ✅ / ❌

Supported Commands:
- Play Video: ✅ / ❌
- Like Video: ✅ / ❌
- Multi-Step: ✅ / ❌
- Subscribe: ✅ / ❌

Overall Status: ✅ PASS / ❌ FAIL
Notes: [Any issues found]
```

## 🐛 Known Issues to Watch For

1. **CSS Caching**: If changes don't appear, hard refresh (Cmd+Shift+R)
2. **OAuth**: First time actions may require OAuth authorization
3. **Page Load**: Multi-step commands may need extra time for navigation
4. **API Rate Limits**: Too many commands quickly may hit limits

## ✅ Success Criteria

All tests should pass with:
- ✅ Modern, polished UI
- ✅ Smooth animations throughout
- ✅ AI fallback working for unsupported commands
- ✅ All supported commands functioning
- ✅ No console errors
- ✅ No UI glitches or overlaps

---

**Happy Testing! 🎉**

If you find any issues, document them with:
1. What you did
2. What you expected
3. What actually happened
4. Screenshots if relevant
