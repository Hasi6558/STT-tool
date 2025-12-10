# Speech-to-Text Writing Tool

A modern, real-time speech-to-text application built with Next.js, featuring AI-powered text transformation capabilities. Record audio, get instant transcriptions, and enhance your writing with AI-powered tools.

## ✨ Features

- **Real-time Speech Recognition**: Live transcription using OpenAI's advanced speech-to-text API
- **AI Text Enhancement**: Transform your transcripts with AI-powered tools:
  - Clean up text
  - Enhance writing style
  - Convert to book-style formatting
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **WebSocket Integration**: Real-time communication for instant feedback
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS and shadcn/ui

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (preferably 20+)
- npm or yarn
- OpenAI API key

### Installation

1. **Extract the zip file**

   Extract the downloaded zip file to your desired location and navigate to the extracted folder:

   ```bash
   cd path/to/extracted/stt-tool
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Basic Recording

1. **Click the microphone button** in the center of the screen
2. **Grant microphone permissions** when prompted
3. **Start speaking** - you'll see real-time transcription
4. **Click the microphone again** to stop recording

### Text Transformation

1. **Record or type text** in the main text area
2. **Click the toggle button** (top-right on desktop) to open the transformation panel
3. **Choose a transformation**:
   - **Clean Up**: Removes errors and improves readability
   - **Enhance**: Improves writing style and flow
   - **Book Style**: Formats text for book-style presentation
4. **Click "Download PDF"** to export your transformed text

### Mobile Usage

- On mobile/tablet devices, use the **"Transcript"** and **"Transform"** tabs at the top
- The transformation panel is hidden on small screens to maximize text editing space

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# TypeScript checking
npm run lint
```

### Project Structure

```
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── Navbar.tsx      # Top navigation
│   │   ├── TextEditor.tsx  # Main recording interface
│   │   └── Modificationbar.tsx # Text transformation panel
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── server.js               # Custom Next.js server with WebSocket
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variable**:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
3. **Deploy** - Vercel will automatically detect Next.js

### Option 2: Railway

1. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   ```

2. **Login and initialize**:

   ```bash
   railway login
   railway init
   ```

3. **Set environment variable**:

   ```bash
   railway variables set OPENAI_API_KEY=your_api_key
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

### Option 3: Docker

Build and run with Docker:

```bash
# Build the image
docker build -t stt-tool .

# Run the container
docker run -p 3000:3000 -e OPENAI_API_KEY=your_api_key stt-tool
```

## 🔧 Configuration

### Environment Variables

| Variable         | Description                 | Required |
| ---------------- | --------------------------- | -------- |
| `OPENAI_API_KEY` | Your OpenAI API key         | Yes      |
| `PORT`           | Server port (default: 3000) | No       |
| `NODE_ENV`       | Environment mode            | No       |

### Audio Settings

The app is configured for optimal speech recognition:

- Sample rate: 24kHz
- Audio format: PCM16
- Echo cancellation: Enabled
- Noise suppression: Enabled

## 🐛 Troubleshooting

### Common Issues

**Microphone not working:**

- Ensure HTTPS in production (required for microphone access)
- Check browser permissions
- Try refreshing the page

**WebSocket connection failed:**

- Check that the server is running on the correct port
- Ensure firewall allows WebSocket connections
- Verify environment variables are set

**OpenAI API errors:**

- Verify your API key is valid and has credits
- Check API rate limits
- Ensure the key has access to Realtime API

**Build failures:**

- Ensure Node.js version is 18+
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Development Tips

- Use browser developer tools to inspect WebSocket connections
- Check server logs for detailed error messages
- Test microphone access in browser console

## 📄 License

This project is private and proprietary.


---

**Built with ❤️ using Next.js, OpenAI, and modern web technologies.**
