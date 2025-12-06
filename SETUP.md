# Real-Time Speech-to-Text Setup Guide

## Overview

This project implements real-time speech-to-text transcription using OpenAI's Realtime API with WebSocket connections.

## Features

- Real-time audio transcription
- Voice Activity Detection (VAD)
- WebSocket-based streaming
- PCM16 audio format support
- Near-field noise reduction

## Prerequisites

- Node.js 18 or higher
- OpenAI API key with Realtime API access
- Modern web browser with microphone support

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Create a `.env` file in the root directory (or use the existing one)
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     NODE_ENV=development
     ```

## Running the Application

**Development mode:**

```bash
npm run dev
```

This starts:

- Next.js app on `http://localhost:3000`
- WebSocket server on `ws://localhost:3000/ws`

**Production mode:**

```bash
npm run build
npm start
```

## How It Works

### Architecture

1. **Server (`server.js`)**

   - Creates HTTP server for Next.js
   - Hosts WebSocket server at `/ws`
   - Proxies audio data to OpenAI Realtime API
   - Handles session management

2. **Client (`TextEditor.tsx`)**
   - Captures microphone audio
   - Converts audio to PCM16 format
   - Streams to WebSocket server
   - Displays real-time transcription

### Audio Flow

```
Microphone → AudioContext → PCM16 Conversion → Base64 Encoding
    → WebSocket Client → Server → OpenAI Realtime API
    → Server → WebSocket Client → UI Display
```

### WebSocket Events

**Client → Server:**

- `{ type: 'init' }` - Initialize transcription session
- `{ type: 'audio', audio: 'base64...' }` - Send audio data
- `{ type: 'stop' }` - Stop transcription

**Server → Client:**

- `{ type: 'ready' }` - Session initialized
- `{ type: 'conversation.item.input_audio_transcription.delta' }` - Partial transcript
- `{ type: 'conversation.item.input_audio_transcription.completed' }` - Final transcript
- `{ type: 'input_audio_buffer.speech_started' }` - Speech detected
- `{ type: 'input_audio_buffer.speech_stopped' }` - Speech ended
- `{ type: 'error', message: '...' }` - Error occurred

## Configuration

### Transcription Settings

In `server.js`, you can modify:

```javascript
{
  input_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'gpt-4o-transcribe',
    prompt: '',        // Optional context
    language: ''       // Auto-detect or specify (e.g., 'en')
  },
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,              // Voice detection sensitivity
    prefix_padding_ms: 300,       // Audio before speech
    silence_duration_ms: 500      // Silence to end turn
  },
  input_audio_noise_reduction: {
    type: 'near_field'  // or 'far_field'
  }
}
```

### Audio Settings

In `TextEditor.tsx`, modify microphone constraints:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    channelCount: 1,
    sampleRate: 24000,
    echoCancellation: true,
    noiseSuppression: true,
  },
});
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**

   - Ensure `.env` file exists with valid `OPENAI_API_KEY`
   - Restart the server after adding the key

2. **Microphone permission denied**

   - Check browser permissions
   - Use HTTPS in production (required for getUserMedia)

3. **No transcription appears**

   - Check browser console for errors
   - Verify OpenAI API key has Realtime API access
   - Check network tab for WebSocket connection

4. **Audio quality issues**
   - Adjust VAD threshold (0.3-0.7)
   - Modify silence_duration_ms
   - Change noise reduction type

### Browser Compatibility

- Chrome/Edge: Full support ✅
- Firefox: Full support ✅
- Safari: Requires HTTPS for microphone access ⚠️

## API Endpoints

- `GET /` - Next.js application
- `POST /api/realtime/token` - Generate ephemeral token (optional)
- `WS /ws` - WebSocket connection for audio streaming

## Security Notes

- Never commit `.env` file to version control
- Use ephemeral tokens in production
- Implement rate limiting for WebSocket connections
- Validate audio data size to prevent abuse

## Development Tips

1. **Monitor WebSocket messages:**

   ```javascript
   // In browser console
   ws.addEventListener("message", (e) => console.log(JSON.parse(e.data)));
   ```

2. **Test audio processing:**

   - Check browser console for audio chunk logs
   - Verify base64 encoding length
   - Monitor network payload size

3. **Debug transcription:**
   - Review OpenAI response types in server logs
   - Check for `error` events
   - Verify VAD detection events

## License

MIT

## Support

For issues or questions:

- OpenAI Realtime API: https://platform.openai.com/docs/api-reference/realtime
- Next.js Documentation: https://nextjs.org/docs
