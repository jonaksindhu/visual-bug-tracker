import * as fs from 'fs';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface ComparisonResult {
  filename: string;
  diffPixels: number;
  totalPixels: number;
  diffPercentage: number;
}

async function compareScreenshots(): Promise<ComparisonResult[]> {
  const baselineDir = path.join(__dirname, '..', 'screenshots', 'baseline');
  const currentDir = path.join(__dirname, '..', 'screenshots', 'current');
  const diffDir = path.join(__dirname, '..', 'screenshots', 'diff');
  const statsPath = path.join(__dirname, '..', 'screenshots', 'compare-stats.json');

  // Ensure diff directory exists
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }

  const results: ComparisonResult[] = [];
  const files = fs.readdirSync(baselineDir);

  for (const file of files) {
    if (!file.endsWith('.png')) continue;

    const baselinePath = path.join(baselineDir, file);
    const currentPath = path.join(currentDir, file);
    const diffPath = path.join(diffDir, file);

    try {
      const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
      const current = PNG.sync.read(fs.readFileSync(currentPath));

      if (baseline.width !== current.width || baseline.height !== current.height) {
        console.error(`Dimensions don't match for ${file}`);
        continue;
      }

      const diff = new PNG({ width: baseline.width, height: baseline.height });
      const diffPixels = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        baseline.width,
        baseline.height,
        { threshold: 0.1 }
      );

      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      const totalPixels = baseline.width * baseline.height;
      const diffPercentage = (diffPixels / totalPixels) * 100;

      results.push({
        filename: file,
        diffPixels,
        totalPixels,
        diffPercentage
      });

      console.log(`${file}: ${diffPixels} pixels different (${diffPercentage.toFixed(2)}%)`);
    } catch (error) {
      console.error(`Error comparing ${file}:`, error);
    }
  }

  // Write results to JSON for the report
  fs.writeFileSync(statsPath, JSON.stringify(results, null, 2));

  return results;
}

compareScreenshots().catch(console.error); 