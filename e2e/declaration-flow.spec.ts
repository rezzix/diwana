import { test, expect } from '@playwright/test';

// Pacing: pauses between steps so the video is watchable (~60s total)
const PAUSE = 2500;       // 2.5s pause after each screen
const SHORT_PAUSE = 800;  // 0.8s pause between small actions
const TYPE_PAUSE = 500;   // 0.5s pause between field fills

test.describe('Declaration submission and controller approval flow', () => {

  test('declarant submits a declaration, controller approves it', async ({ page }) => {
    // Accept all confirm dialogs throughout the test
    page.on('dialog', dialog => dialog.accept());

    // ===== STEP 1: Declarant logs in =====
    await page.goto('/login');
    await page.waitForTimeout(PAUSE);

    // Expand quick login
    await page.getByRole('button', { name: /Quick login/i }).click();
    await page.waitForTimeout(SHORT_PAUSE);

    // Click on a DECLARANT user (ahmed)
    await page.getByRole('button', { name: /Ahmed Benali/i }).click();

    // Should land on dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('DECLARANT')).toBeVisible();
    await page.waitForTimeout(PAUSE);
    await page.screenshot({ path: 'e2e/screenshots/01-declarant-dashboard.png' });

    // ===== STEP 2: Navigate to declarations and create a new one =====
    await page.getByRole('link', { name: 'Declarations' }).click();
    await expect(page.getByText(/My Declarations/i)).toBeVisible();
    await page.waitForTimeout(PAUSE);

    await page.getByRole('link', { name: /New Declaration/i }).click();
    await expect(page.getByRole('heading', { name: 'New Declaration' })).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // ----- Goods line 1: Laptops -----
    await page.getByPlaceholder('e.g. 8471.30').fill('8471.30');
    await page.waitForTimeout(TYPE_PAUSE);
    const descRow1 = page.locator('section').filter({ hasText: 'Add Goods Line' });
    await descRow1.locator('input').nth(1).fill('Laptop computers');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('spinbutton').nth(0).fill('10');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('spinbutton').nth(1).fill('500');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('button', { name: /Add Goods Line/i }).click();
    await expect(page.locator('table').getByRole('cell', { name: '8471.30' })).toBeVisible();
    await page.waitForTimeout(SHORT_PAUSE);

    // ----- Goods line 2: Printers -----
    // After adding line 1, the form resets — fill fresh fields
    await page.getByPlaceholder('e.g. 8471.30').fill('8443.32');
    await page.waitForTimeout(TYPE_PAUSE);
    const descRow2 = page.locator('section').filter({ hasText: 'Add Goods Line' });
    await descRow2.locator('input').nth(1).fill('Printers');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('spinbutton').nth(0).fill('5');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('spinbutton').nth(1).fill('200');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('button', { name: /Add Goods Line/i }).click();
    await expect(page.locator('table').getByRole('cell', { name: '8443.32' })).toBeVisible();
    await page.waitForTimeout(SHORT_PAUSE);

    // ----- Goods line 3: Monitors -----
    await page.getByPlaceholder('e.g. 8471.30').fill('8528.72');
    await page.waitForTimeout(TYPE_PAUSE);
    const descRow3 = page.locator('section').filter({ hasText: 'Add Goods Line' });
    await descRow3.locator('input').nth(1).fill('Monitors');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('spinbutton').nth(0).fill('8');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('spinbutton').nth(1).fill('300');
    await page.waitForTimeout(TYPE_PAUSE);
    await page.getByRole('button', { name: /Add Goods Line/i }).click();
    await expect(page.locator('table').getByRole('cell', { name: '8528.72' })).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // Select customs office — must match the controller's office for the flow to work
    const customsSection = page.locator('section').filter({ hasText: 'Customs Information' });
    await customsSection.locator('select').selectOption('Port de Casablanca');
    await page.waitForTimeout(SHORT_PAUSE);

    // Add notes
    await page.getByRole('textbox').last().fill('Urgent shipment — please expedite');
    await page.waitForTimeout(PAUSE);

    // Create the declaration
    await page.getByRole('button', { name: /Create Declaration/i }).click();
    await expect(page.locator('header').getByText('DRAFT')).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // Capture the declaration number for later reference
    const declarationNumber = await page.locator('header h1').textContent();
    await page.screenshot({ path: 'e2e/screenshots/02-declaration-created.png' });

    // ===== STEP 3: Upload supporting document =====
    // Scroll to Supporting Documents section
    await page.getByRole('heading', { name: 'Supporting Documents' }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(SHORT_PAUSE);

    // Select document type
    await page.locator('form', { has: page.locator('#file-input') }).locator('select').selectOption('COMMERCIAL_INVOICE');
    await page.waitForTimeout(SHORT_PAUSE);

    // Upload file
    await page.locator('#file-input').setInputFiles('/home/ossama/Pictures/scanned_invoice.jpg');
    await page.waitForTimeout(SHORT_PAUSE);

    // Click upload button
    await page.locator('form', { has: page.locator('#file-input') }).getByRole('button', { name: /Upload/i }).click();
    await page.waitForTimeout(PAUSE * 2); // wait for upload to complete
    await expect(page.locator('table').getByRole('cell', { name: 'Commercial Invoice' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/03-document-uploaded.png' });

    // ===== STEP 4: Submit the declaration =====
    // Scroll back to top to see the Submit button
    await page.locator('header').scrollIntoViewIfNeeded();
    await page.waitForTimeout(SHORT_PAUSE);
    await page.getByRole('button', { name: /Submit for Review/i }).click();

    await expect(page.locator('header').getByText('SUBMITTED')).toBeVisible();
    await page.waitForTimeout(PAUSE);
    await page.screenshot({ path: 'e2e/screenshots/04-declaration-submitted.png' });

    // ===== STEP 5: Log out =====
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // ===== STEP 6: Controller logs in =====
    await page.goto('/login');
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: /Quick login/i }).click();
    await page.waitForTimeout(SHORT_PAUSE);

    // Click on a CONTROLLER user (hicham — assigned to Port de Casablanca)
    await page.getByRole('button', { name: /Hicham Tazi/i }).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('CONTROLLER')).toBeVisible();
    await page.waitForTimeout(PAUSE);
    await page.screenshot({ path: 'e2e/screenshots/05-controller-dashboard.png' });

    // ===== STEP 7: Go to Control Desk =====
    await page.getByRole('link', { name: 'Control Desk' }).click();
    await expect(page.getByRole('heading', { name: 'Control Desk' })).toBeVisible();
    await expect(page.getByText('Port de Casablanca', { exact: true })).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // Find and click the Review link for OUR declaration (by declaration number)
    const reviewLink = page.locator('tr', { hasText: declarationNumber }).getByRole('link', { name: 'Review' });
    await reviewLink.click();
    await page.waitForTimeout(PAUSE);

    // Verify we're on the correct declaration
    await expect(page.locator('header')).toContainText(declarationNumber);
    await expect(page.locator('header').getByText('SUBMITTED')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/06-declaration-review.png' });

    // ===== STEP 8: View the goods lines and supporting document =====
    // Verify all 3 goods lines are present
    await expect(page.getByText('Goods Lines (3)')).toBeVisible();
    await page.waitForTimeout(SHORT_PAUSE);

    // Scroll to supporting documents
    await page.getByRole('heading', { name: 'Supporting Documents' }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(SHORT_PAUSE);
    await expect(page.locator('table').getByRole('cell', { name: 'Commercial Invoice' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/07-controller-viewing-documents.png' });

    // Click View to open the document viewer
    await page.getByRole('button', { name: 'View' }).first().click();
    await page.waitForTimeout(PAUSE * 2);
    await page.screenshot({ path: 'e2e/screenshots/08-document-viewer.png' });

    // Close the viewer (× button)
    await page.locator('.fixed.inset-0.z-50 button:has-text("×")').click();
    await page.waitForTimeout(SHORT_PAUSE);

    // ===== STEP 9: Approve the declaration =====
    // Scroll back to top for the Approve button
    await page.locator('header').scrollIntoViewIfNeeded();
    await page.waitForTimeout(SHORT_PAUSE);
    await page.getByRole('button', { name: /Approve/i }).click();

    await expect(page.locator('header').getByText('APPROVED')).toBeVisible();
    await page.waitForTimeout(PAUSE);
    await page.screenshot({ path: 'e2e/screenshots/09-declaration-approved.png' });

    // Verify audit trail section exists
    await page.getByRole('heading', { name: 'Audit Trail' }).scrollIntoViewIfNeeded();
    await expect(page.getByText('Audit Trail')).toBeVisible();
    await page.waitForTimeout(PAUSE * 3); // final pause to let the viewer see the result
  });
});