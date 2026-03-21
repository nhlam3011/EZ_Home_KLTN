import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const FOLDER = path.join(process.cwd(), 'screenshots_light_admin_subpages');

if (!fs.existsSync(FOLDER)) {
  fs.mkdirSync(FOLDER);
}

const routes = [
  { name: 'building_detail', path: '/admin/buildings/15' },
  { name: 'room_detail', path: '/admin/rooms/132' },
  { name: 'room_contracts', path: '/admin/rooms/132/contracts' },
  { name: 'room_add_new', path: '/admin/rooms/new' },
  { name: 'resident_detail', path: '/admin/residents/60' },
  { name: 'resident_edit', path: '/admin/residents/60/edit' },
  { name: 'resident_add_new', path: '/admin/residents/new' },
  { name: 'invoice_edit', path: '/admin/invoices/371/edit' },
  { name: 'invoice_add_new', path: '/admin/invoices/new' },
  { name: 'service_add_new', path: '/admin/services/new' }
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('dialog', async dialog => {
    console.log(`Dismissing dialog: ${dialog.message()}`);
    await dialog.accept();
  });
  
  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Waiting for the inputs to appear
  await page.waitForSelector('input[type="tel"]');
  console.log('Filling credentials...');
  await page.type('input[type="tel"]', '0963304396'); // Admin account
  await page.type('input[type="password"]', 'admin');
  
  console.log('Clicking login...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Logged in successfully!');

  // Navigate to dashboard first to ensure the navbar is loaded
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  
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
      await Promise.race([
        page.goto(`http://localhost:3000${route.path}`),
        new Promise(r => setTimeout(r, 6000))
      ]);
      // Wait an extra seconds for charts or data to render if possible
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
