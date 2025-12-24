import * as fs from "fs";
import * as path from "path";
import { HTMLTemplateGenerator } from "./htmlGenerator";
import { ReportConfig } from "./types";

class ReportGenerator {
  private htmlGenerator: HTMLTemplateGenerator;

  constructor() {
    this.htmlGenerator = new HTMLTemplateGenerator();
  }

  public async generateFromFile(
    inputFilePath: string,
    outputFilePath?: string
  ): Promise<void> {
    try {
      // Read input file
      const inputData = await this.readInputFile(inputFilePath);

      // Generate HTML
      const html = this.htmlGenerator.generate(
        inputData.entries,
        inputData.reportTitle,
        inputData.clientName
      );

      // Determine output path
      const outputPath =
        outputFilePath || this.getDefaultOutputPath(inputFilePath);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write output file
      fs.writeFileSync(outputPath, html, "utf-8");

      console.log("✅ Report generated successfully!");
      console.log(`📄 Input: ${inputFilePath}`);
      console.log(`📝 Output: ${outputPath}`);
      console.log(`📊 Total entries: ${inputData.entries.length}`);
    } catch (error) {
      console.error("❌ Error generating report:", error);
      throw error;
    }
  }

  private async readInputFile(filePath: string): Promise<ReportConfig> {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      // Validate data structure
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Input file must contain an "entries" array');
      }

      // Validate each entry
      data.entries.forEach((entry: any, index: number) => {
        if (
          !entry.rawSpeechText ||
          !entry.AIEnhancedText ||
          !entry.enhancementType
        ) {
          throw new Error(`Entry at index ${index} is missing required fields`);
        }
        if (!["book", "clean", "enhance"].includes(entry.enhancementType)) {
          throw new Error(
            `Entry at index ${index} has invalid enhancementType: ${entry.enhancementType}`
          );
        }
      });

      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in input file: ${error.message}`);
      }
      throw error;
    }
  }

  private getDefaultOutputPath(inputPath: string): string {
    const inputDir = path.dirname(inputPath);
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    return path.join(
      inputDir,
      "..",
      "output",
      `${inputFileName}_report_${timestamp}.html`
    );
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("📋 HTML Report Generator for Speech-to-Text AI Enhancement");
    console.log("");
    console.log("Usage:");
    console.log("  npm run generate <input-file.json> [output-file.html]");
    console.log("");
    console.log("Example:");
    console.log("  npm run generate data/sample-input.json");
    console.log(
      "  npm run generate data/sample-input.json output/my-report.html"
    );
    console.log("");
    process.exit(0);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const generator = new ReportGenerator();
  await generator.generateFromFile(inputFile, outputFile);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { ReportGenerator };
