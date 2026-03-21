import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Try to find the "Switch to light mode" button and click it to ensure light mode
  const lightModeBtn = await page.$('button[aria-label="Switch to light mode"]');
  if (lightModeBtn) {
    console.log('Currently in dark mode. Switching to light mode...');
    await lightModeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  const filePath = path.join(process.cwd(), 'login_page.png');
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Saved screenshot: ${filePath}`);

  await browser.close();
  console.log('Done!');
})();
