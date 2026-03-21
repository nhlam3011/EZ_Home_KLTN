import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const FOLDER = path.join(process.cwd(), 'screenshots_tenant');

if (!fs.existsSync(FOLDER)) {
  fs.mkdirSync(FOLDER);
}

const routes = [
  { name: 'dashboard', path: '/tenant' },
  { name: 'rooms', path: '/tenant/rooms' },
  { name: 'services', path: '/tenant/services' },
  { name: 'contracts', path: '/tenant/contracts' },
  { name: 'invoices', path: '/tenant/invoices' },
  { name: 'issues', path: '/tenant/issues' },
  { name: 'messages', path: '/tenant/messages' },
  { name: 'community', path: '/tenant/community' },
  { name: 'ai-assistant', path: '/tenant/ai-assistant' },
  { name: 'notifications', path: '/tenant/notifications' },
  { name: 'settings', path: '/tenant/settings' }
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Waiting for the inputs to appear
  await page.waitForSelector('input[type="tel"]');
  console.log('Filling credentials...');
  await page.type('input[type="tel"]', '0399431251');
  await page.type('input[type="password"]', 'mklaLAM123');
  
  console.log('Clicking login...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Logged in successfully!');

  // Navigate to dashboard first to ensure the navbar is loaded
  await page.goto('http://localhost:3000/tenant', { waitUntil: 'networkidle2' });
  
  // Try to find the "Switch to light mode" button and click it
  const lightModeBtn = await page.$('button[aria-label="Switch to light mode"]');
  if (lightModeBtn) {
    console.log('Currently in dark mode. Switching to light mode...');
    await lightModeBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  } else {
    console.log('Already in light mode or button not found.');
  }

  for (const route of routes) {
    console.log(`Navigating to ${route.name}...`);
    try {
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle2' });
      // Wait an extra seconds for charts or data to load
      await new Promise(r => setTimeout(r, 3000));
      const filePath = path.join(FOLDER, `${route.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved screenshot: ${filePath}`);
    } catch (e) {
      console.error(`Failed to capture ${route.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Done!');
})();
