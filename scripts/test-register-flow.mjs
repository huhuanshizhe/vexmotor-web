import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const BASE_URL = 'http://localhost:5000/register';
const TEST_EMAIL = `regtest+${Date.now()}@example.com`;
const ADMIN_DIR = 'F:/data/dev/html/lianchuan/vexmotor-admin';

function queryDb(label, email) {
  const cmd = email
    ? `cd "${ADMIN_DIR}" && npx tsx scripts/debug-registration-db.ts "${email}"`
    : `cd "${ADMIN_DIR}" && npx tsx scripts/debug-registration-db.ts`;
  console.log(`\n===== DB CHECK: ${label} =====`);
  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: 60000 });
    console.log(output.trim());
  } catch (error) {
    console.error('DB query failed:', error.stdout?.toString?.() ?? error.message);
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const registerRequests = [];

  queryDb('before test');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/front/auth/register') || url.includes('/api/front/upload/registration')) {
      registerRequests.push({ phase: 'pending', method: request.method(), url });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/front/auth/register') || url.includes('/api/front/upload/registration')) {
      const body = await response.text().catch(() => '');
      registerRequests.push({
        phase: 'response',
        method: response.request().method(),
        url,
        status: response.status(),
        body: body.slice(0, 500),
      });
    }
  });

  console.log(`\nTest email: ${TEST_EMAIL}`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  await page.getByPlaceholder('name@company.com').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill('TestPass123!');
  await page.locator('input').nth(2).fill('Reg');
  await page.locator('input').nth(3).fill('Tester');

  queryDb('after step 1 fields filled (before Continue)', TEST_EMAIL);

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(500);

  queryDb('after step 1 Continue', TEST_EMAIL);

  await page.locator('input').first().fill('Acme Test Co');
  await page.getByPlaceholder('https://').fill('https://acme.example.com');
  await page.locator('label').filter({ hasText: /Tax ID|EIN|EORI/ }).locator('input').fill('TAX-123');

  queryDb('after step 2 fields filled (before Continue)', TEST_EMAIL);

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(500);

  queryDb('after step 2 Continue', TEST_EMAIL);

  await page.getByText('I agree to the Terms of Service.').locator('..').locator('input[type="checkbox"]').check();
  await page.getByText('I agree to the Privacy Policy.').locator('..').locator('input[type="checkbox"]').check();
  await page.getByText('I confirm export compliance responsibility').locator('..').locator('input[type="checkbox"]').check();

  queryDb('before final submit', TEST_EMAIL);

  const submit = page.getByRole('button', { name: 'Create business account' });
  await submit.click();
  await wait(3000);

  queryDb('after final submit', TEST_EMAIL);

  const feedback = await page.locator('.form-feedback-error, .form-feedback-success').allTextContents();
  const currentUrl = page.url();

  console.log('\n===== UI RESULT =====');
  console.log('URL:', currentUrl);
  console.log('Feedback:', feedback.join(' | ') || '(none)');

  console.log('\n===== NETWORK (register/upload only) =====');
  console.log(JSON.stringify(registerRequests, null, 2));

  await page.screenshot({ path: 'F:/data/dev/html/lianchuan/vexmotor-web/scripts/register-flow-result.png', fullPage: true });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
