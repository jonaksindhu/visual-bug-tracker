import { chromium } from '@playwright/test';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const program = new Command();

interface UrlConfig {
  urls: string[];
}

function sanitizeUrl(urlString: string): string {
  const parsed = url.parse(urlString);
  return `${parsed.hostname}${parsed.pathname}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function captureScreenshot(url: string, mode: 'baseline' | 'current'): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const screenshotPath = path.join(__dirname, '..', 'screenshots', mode, `${sanitizeUrl(url)}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  program
    .option('--mode <mode>', 'Screenshot mode (baseline or current)', 'current')
    .option('--url <url>', 'Single URL to capture')
    .option('--batch', 'Capture screenshots from urls.json');

  program.parse(process.argv);
  const options = program.opts();

  if (!['baseline', 'current'].includes(options.mode)) {
    console.error('Mode must be either "baseline" or "current"');
    process.exit(1);
  }

  if (options.url) {
    await captureScreenshot(options.url, options.mode);
  } else if (options.batch) {
    try {
      const config: UrlConfig = JSON.parse(fs.readFileSync('urls.json', 'utf-8'));
      for (const url of config.urls) {
        await captureScreenshot(url, options.mode);
      }
    } catch (error) {
      console.error('Error reading urls.json:', error);
      process.exit(1);
    }
  } else {
    console.error('Please provide either --url or --batch option');
    process.exit(1);
  }
}

main().catch(console.error); 