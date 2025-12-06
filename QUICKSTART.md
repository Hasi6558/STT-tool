# Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

### 2. Using the Speech-to-Text Feature

1. Open your browser to `http://localhost:3000`
2. Click the microphone button to start recording
3. Speak into your microphone
4. Watch the real-time transcription appear below
5. Click the microphone button again to stop recording

### 3. Expected Behavior

- **Status Updates:**

  - "Ready" - System is ready to record
  - "Initializing..." - Connecting to microphone
  - "Connecting to transcription service..." - Setting up OpenAI connection
  - "Recording..." - Actively recording and transcribing
  - "Speech detected..." - Voice activity detected
  - "Processing..." - Finalizing transcription segment

- **Microphone Button:**
  - Breathing animation when active
  - Red color indicates recording status
  - Icon changes based on recording state

### 4. Troubleshooting

**Issue: "OpenAI API key not configured"**

- Solution: Check that `.env` file has `OPENAI_API_KEY=sk-proj-...`

**Issue: Microphone access denied**

- Solution: Allow microphone permissions in your browser

**Issue: No transcription appearing**

- Solution: Check browser console (F12) for errors
- Verify WebSocket connection is established
- Try speaking louder or closer to microphone

**Issue: Terminal shows "EADDRINUSE"**

- Solution: Port 3000 is in use. Kill the process or change the port in `server.js`

### 5. Stopping the Server

Press `Ctrl+C` in the terminal where the server is running

## 📝 Configuration Tips

### Adjust Voice Detection Sensitivity

Edit `server.js` line ~90:

```javascript
threshold: 0.5,  // Lower = more sensitive (0.3-0.7)
```

### Change Language

Edit `server.js` line ~87:

```javascript
language: "en"; // Specify language code (en, es, fr, etc.)
```

### Adjust Silence Detection

Edit `server.js` line ~93:

```javascript
silence_duration_ms: 500; // Milliseconds of silence before ending turn
```

## 🔍 Development Notes

- WebSocket connection: `ws://localhost:3000/ws`
- Audio format: PCM16, 24kHz, mono
- Voice Activity Detection: Server-side VAD enabled
- Real-time streaming: Audio chunks sent every ~170ms

## 📦 Project Structure

```
├── server.js                    # WebSocket & Next.js server
├── src/
│   └── components/
│       └── TextEditor.tsx       # Main UI component
├── .env                         # Environment variables
└── package.json                 # Dependencies
```

## 🎯 Next Steps

- Customize the UI styling in `TextEditor.tsx`
- Add export/save transcript functionality
- Implement multiple language support
- Add audio playback features
- Configure custom vocabulary/prompts

## 💡 Tips

1. **Better Accuracy:** Speak clearly and reduce background noise
2. **Lower Latency:** Use wired internet connection
3. **Cost Control:** Monitor OpenAI API usage dashboard
4. **Testing:** Check browser console for debugging info
