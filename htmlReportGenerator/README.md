# HTML Report Generator

A TypeScript-based tool for generating professional HTML reports from Speech-to-Text AI enhancement data.

## Features

- ✨ Clean and professional HTML report generation
- 📊 Visual summary with statistics
- 🎨 Color-coded enhancement types (Book, Clean, Enhance)
- 📱 Responsive design for all devices
- 🖨️ Print-friendly layout
- 📄 Configurable JSON input

## Installation

```bash
npm install
```

## Usage

### Build the project

```bash
npm run build
```

### Generate a report

```bash
npm run generate <input-file.json> [output-file.html]
```

### Examples

Generate report with default output location:

```bash
npm run generate data/sample-input.json
```

Generate report with custom output location:

```bash
npm run generate data/sample-input.json output/my-report.html
```

## Input Format

Create a JSON file with the following structure:

```json
{
  "reportTitle": "Your Report Title",
  "clientName": "Client Name (Optional)",
  "entries": [
    {
      "rawSpeechText": "Original speech text here",
      "AIEnhancedText": "Enhanced version here",
      "enhancementType": "book"
    }
  ]
}
```

### Enhancement Types

- **book**: Book Style - Formal, literary style
- **clean**: Cleaned Version - Removes filler words, improves clarity
- **enhance**: Enhanced Version - Improves grammar and structure

## Project Structure

```
htmlReportGenerator/
├── src/
│   ├── index.ts           # Main entry point
│   ├── htmlGenerator.ts   # HTML template generator
│   └── types.ts          # TypeScript type definitions
├── data/
│   └── sample-input.json # Sample input file
├── output/               # Generated reports (auto-created)
├── package.json
├── tsconfig.json
└── README.md
```

## Output

The generated HTML report includes:

- Professional header with report title and metadata
- Summary section with statistics
- Individual cards for each entry showing:
  - Original speech text
  - AI-enhanced text
  - Enhancement type badge
- Responsive design that works on all devices
- Print-optimized styling

## Development

Run in development mode:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Run compiled version:

```bash
npm start
```

## Requirements

- Node.js 18+
- TypeScript 5+

## License

MIT
