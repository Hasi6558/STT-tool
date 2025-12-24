import { ReportEntry, EnhancementType } from "./types";

export class HTMLTemplateGenerator {
  private getEnhancementTypeLabel(type: EnhancementType): string {
    const labels: Record<EnhancementType, string> = {
      book: "Book Style",
      clean: "Cleaned Version",
      enhance: "Enhanced Version",
    };
    return labels[type];
  }

  private getEnhancementTypeColor(type: EnhancementType): string {
    const colors: Record<EnhancementType, string> = {
      book: "#8b5cf6",
      clean: "#10b981",
      enhance: "#3b82f6",
    };
    return colors[type];
  }

  private generateEntryHTML(entry: ReportEntry, index: number): string {
    const typeLabel = this.getEnhancementTypeLabel(entry.enhancementType);
    const typeColor = this.getEnhancementTypeColor(entry.enhancementType);

    return `
    <div class="entry-card">
      <div class="entry-header">
        <div class="entry-number">Entry #${index + 1}</div>
        <span class="enhancement-badge" style="background-color: ${typeColor}">
          ${typeLabel}
        </span>
      </div>
      
      <div class="text-section">
        <h3 class="section-title">Original Speech Text</h3>
        <div class="text-content original-text">
          ${this.escapeHtml(entry.rawSpeechText)}
        </div>
      </div>

      <div class="divider"></div>

      <div class="text-section">
        <h3 class="section-title">AI Enhanced Text</h3>
        <div class="text-content enhanced-text">
          ${this.escapeHtml(entry.AIEnhancedText)}
        </div>
      </div>
    </div>`;
  }

  private escapeHtml(text: string): string {
    const div = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>");
    return div;
  }

  private generateStyles(): string {
    return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        min-height: 100vh;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px;
        text-align: center;
      }

      .header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        font-weight: 700;
      }

      .header-meta {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        opacity: 0.95;
      }

      .meta-icon {
        font-size: 1.2rem;
      }

      .content {
        padding: 40px;
      }

      .summary {
        background: #f8fafc;
        padding: 25px;
        border-radius: 8px;
        margin-bottom: 30px;
        border-left: 4px solid #667eea;
      }

      .summary h2 {
        color: #667eea;
        margin-bottom: 15px;
        font-size: 1.5rem;
      }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }

      .stat-item {
        background: white;
        padding: 15px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #667eea;
      }

      .stat-label {
        font-size: 0.9rem;
        color: #64748b;
        margin-top: 5px;
      }

      .entry-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 30px;
        margin-bottom: 25px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .entry-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
      }

      .entry-number {
        font-size: 1.3rem;
        font-weight: bold;
        color: #1e293b;
      }

      .enhancement-badge {
        padding: 8px 16px;
        border-radius: 20px;
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .text-section {
        margin-bottom: 20px;
      }

      .section-title {
        color: #475569;
        font-size: 1.1rem;
        margin-bottom: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title::before {
        content: '●';
        color: #667eea;
      }

      .text-content {
        padding: 20px;
        border-radius: 6px;
        font-size: 1rem;
        line-height: 1.8;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .original-text {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        color: #92400e;
      }

      .enhanced-text {
        background: #d1fae5;
        border-left: 4px solid #10b981;
        color: #065f46;
      }

      .divider {
        height: 1px;
        background: linear-gradient(to right, transparent, #e2e8f0, transparent);
        margin: 20px 0;
      }

      .footer {
        background: #f8fafc;
        padding: 30px;
        text-align: center;
        color: #64748b;
        font-size: 0.9rem;
        border-top: 1px solid #e2e8f0;
      }

      @media print {
        body {
          background: white;
          padding: 0;
        }

        .container {
          box-shadow: none;
        }

        .entry-card {
          page-break-inside: avoid;
        }
      }

      @media (max-width: 768px) {
        .header h1 {
          font-size: 1.8rem;
        }

        .content {
          padding: 20px;
        }

        .entry-card {
          padding: 20px;
        }

        .header-meta {
          flex-direction: column;
          gap: 10px;
        }
      }
    </style>`;
  }

  public generate(
    entries: ReportEntry[],
    title: string = "Speech-to-Text AI Enhancement Report",
    clientName?: string
  ): string {
    const generatedDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const stats = this.calculateStats(entries);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${this.generateStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <div class="header-meta">
        ${
          clientName
            ? `<div class="meta-item"><span class="meta-icon">👤</span><span>Client: ${clientName}</span></div>`
            : ""
        }
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <span>${generatedDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">📊</span>
          <span>${entries.length} Entries</span>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="summary">
        <h2>Report Summary</h2>
        <p>This report contains AI-enhanced transformations of speech-to-text content across different enhancement styles.</p>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-value">${entries.length}</div>
            <div class="stat-label">Total Entries</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.book}</div>
            <div class="stat-label">Book Style</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.clean}</div>
            <div class="stat-label">Cleaned</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.enhance}</div>
            <div class="stat-label">Enhanced</div>
          </div>
        </div>
      </div>

      ${entries
        .map((entry, index) => this.generateEntryHTML(entry, index))
        .join("\n")}
    </div>

    <div class="footer">
      <p>Generated by Speech-to-Text AI Enhancement Report Generator</p>
      <p>© ${new Date().getFullYear()} - All Rights Reserved</p>
    </div>
  </div>
</body>
</html>`;
  }

  private calculateStats(entries: ReportEntry[]) {
    return {
      book: entries.filter((e) => e.enhancementType === "book").length,
      clean: entries.filter((e) => e.enhancementType === "clean").length,
      enhance: entries.filter((e) => e.enhancementType === "enhance").length,
    };
  }
}
