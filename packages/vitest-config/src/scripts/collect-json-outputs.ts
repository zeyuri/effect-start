import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

async function collectCoverageFiles() {
  try {
    // Define the patterns to search
    const patterns = ["../../apps/*", "../../packages/*"];

    // Define the destination directory (you can change this as needed)
    const destinationDir = path.join(process.cwd(), "coverage/raw");

    // Create the destination directory if it doesn't exist
    await fs.mkdir(destinationDir, { recursive: true });

    // Arrays to collect all directories and directories with coverage
    const allDirectories = [];
    const directoriesWithCoverage = [];

    // Process each pattern
    for (const pattern of patterns) {
      // Find all paths matching the pattern
      const matches = await glob(pattern);

      // Filter to only include directories
      for (const match of matches) {
        const stats = await fs.stat(match);

        if (stats.isDirectory()) {
          allDirectories.push(match);
          const directoryName = path.basename(match);
          const coverageCandidates = [
            {
              label: "coverage.json",
              filePath: path.join(match, "coverage.json"),
              suffix: "",
            },
            {
              label: "coverage/coverage.json",
              filePath: path.join(match, "coverage", "coverage.json"),
              suffix: "-coverage",
            },
          ];

          for (const candidate of coverageCandidates) {
            try {
              await fs.access(candidate.filePath);

              directoriesWithCoverage.push(
                path.join(directoryName, candidate.label),
              );

              const destinationFile = path.join(
                destinationDir,
                `${directoryName}${candidate.suffix}.json`,
              );

              await fs.copyFile(candidate.filePath, destinationFile);
            } catch {
              // File doesn't exist in this directory, skip
            }
          }
        }
      }
    }

    // Create clean patterns for display (without any "../" prefixes)
    const replaceDotPatterns = (str: string) => str.replace(/\.\.\//g, "");

    if (directoriesWithCoverage.length > 0) {
      console.log(
        `Found coverage files in: ${directoriesWithCoverage
          .map(replaceDotPatterns)
          .join(", ")}`,
      );
    }

    console.log(`Coverage collected into: ${path.join(process.cwd())}`);
  } catch (error) {
    console.error("Error collecting coverage files:", error);
  }
}

// Run the function
collectCoverageFiles();
