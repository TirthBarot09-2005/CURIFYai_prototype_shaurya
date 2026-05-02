
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  await page.goto('http://localhost:5173/auth');
  await page.waitForTimeout(2000);
  
  // Try clicking patient demo to see if routing works
  const demoBtn = page.locator('text=Patient Demo');
  if (await demoBtn.count() > 0) {
    await demoBtn.click();
    await page.waitForTimeout(2000);
    console.log('URL after demo click:', page.url());
  }

  await browser.close();
})();

