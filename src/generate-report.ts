import * as fs from 'fs';
import * as path from 'path';

interface ComparisonResult {
  filename: string;
  diffPixels: number;
  totalPixels: number;
  diffPercentage: number;
}

function generateHtmlReport(): void {
  const baselineDir = path.join(__dirname, '..', 'screenshots', 'baseline');
  const currentDir = path.join(__dirname, '..', 'screenshots', 'current');
  const diffDir = path.join(__dirname, '..', 'screenshots', 'diff');
  const statsPath = path.join(__dirname, '..', 'screenshots', 'compare-stats.json');

  const files = fs.readdirSync(baselineDir).filter(file => file.endsWith('.png'));

  let stats: Record<string, ComparisonResult> = {};
  let statsWarning = '';
  if (fs.existsSync(statsPath)) {
    try {
      const statsArr: ComparisonResult[] = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      stats = Object.fromEntries(statsArr.map(s => [s.filename, s]));
    } catch (e) {
      statsWarning = '<div style="color: red;">Could not read compare-stats.json for diff statistics.</div>';
    }
  } else {
    statsWarning = '<div style="color: orange;">No compare-stats.json found. Run the compare script first to see detailed stats.</div>';
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Test Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .comparison {
            margin-bottom: 40px;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
        }
        .comparison h2 {
            margin-top: 0;
        }
        .images {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        .image-container {
            text-align: center;
        }
        .image-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #eee;
        }
        .image-container h3 {
            margin: 10px 0;
        }
        .stats {
            margin-top: 10px;
            background: #f9f9f9;
            padding: 10px;
            border-radius: 6px;
            font-size: 0.95em;
        }
        .stats .diff {
            color: #b30000;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Visual Regression Test Report</h1>
    ${statsWarning}
    ${files.map(file => {
      const stat = stats[file];
      return `
    <div class="comparison">
        <h2>${file}</h2>
        <div class="images">
            <div class="image-container">
                <h3>Baseline</h3>
                <img src="screenshots/baseline/${file}" alt="Baseline">
            </div>
            <div class="image-container">
                <h3>Current</h3>
                <img src="screenshots/current/${file}" alt="Current">
            </div>
            <div class="image-container">
                <h3>Diff</h3>
                <img src="screenshots/diff/${file}" alt="Diff">
            </div>
        </div>
        <div class="stats">
          ${stat ? `
            <span class="diff">${stat.diffPixels} pixels different</span> out of ${stat.totalPixels} total pixels
            (<span class="diff">${stat.diffPercentage.toFixed(2)}%</span> difference)
          ` : '<span style="color: #888;">No diff statistics available for this file.</span>'}
        </div>
    </div>
      `;
    }).join('')}
</body>
</html>
  `;

  fs.writeFileSync(path.join(__dirname, '..', 'report.html'), htmlContent);
  console.log('Report generated: report.html');
}

generateHtmlReport(); 