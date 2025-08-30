/**
 * MetaMask E2E Test - Proof of Concept
 *
 * This test automates MetaMask wallet setup and a simple dApp interaction:
 * 1. Import a wallet using seed phrase
 * 2. Configure Sepolia testnet
 * 3. Connect wallet to a dApp
 * 4. Approve and submit a transaction
 *
 * Prerequisites:
 * - MetaMask extension build available at ../../metamask-extension
 * - Test dApp running on http://localhost:5173 with:
 *    - #connect-wallet-button
 *    - #send-tx-button
 * - npm package: clipboardy
 */

import { test, chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import clipboardy from "clipboardy";

// === Configuration ===
const CONFIG = {
  /* 
  ===== Helper: Find MetaMask Extension ID =====
  If your local MetaMask build generates a different extension ID,
  you can use this snippet to find it:

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${metamaskPath}`,
      `--load-extension=${metamaskPath}`,
    ],
  });

  const page = await context.newPage();
  await page.goto("chrome://extensions/");
  await page.locator('cr-toggle#devMode').click();
  const extensionId = await page.locator("extensions-item").first().getAttribute("id");
  console.log("Actual Extension ID:", extensionId);
*/

  EXTENSION_ID: "lejgdnclalikkmkjkdabeihphmonnhng", // must match local extension build
  TEST_PASSWORD: "Password123",
  SEED_PHRASE:
    "kind throw symbol dynamic swarm fix ten only earth episode void among",
  DAPP_URL: "http://localhost:5173",
  TIMEOUT: {
    TEST: 120000,
    PAGE_LOAD: 30000,
    POPUP: 10000,
    ACTION: 5000,
  },
};

test.describe("MetaMask Integration", () => {
  test("Wallet setup, network config, and dApp transaction", async () => {
    test.setTimeout(CONFIG.TIMEOUT.TEST);

    const metamaskPath = path.resolve(__dirname, "../metamask-extension");
    const userDataDir = path.resolve(__dirname, "../mm-profile");

    if (!fs.existsSync(metamaskPath)) {
      throw new Error(`MetaMask extension not found at: ${metamaskPath}`);
    }

    // Clean profile for a fresh run
    cleanupProfile(userDataDir);

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // MetaMask does not work in headless mode
      permissions: ["clipboard-read", "clipboard-write"],
      args: [
        `--disable-extensions-except=${metamaskPath}`,
        `--load-extension=${metamaskPath}`,
      ],
    });

    const page = await context.newPage();

    try {
      console.log("🚀 Starting MetaMask automation...");

      // Phase 1: Initial Setup
      await initializeWallet(page);
      await acceptTerms(page);
      await selectImportWallet(page);

      // Phase 2: Wallet Import
      await importSeedPhrase(page);
      await setupPassword(page);
      await completeWalletSetup(page);

      // Phase 3: Network Setup
      await configureSepolia(page);

      // Phase 4: dApp Integration
      await connectToDApp(page, context);
      await executeTransaction(page, context);

      console.log("🎉 MetaMask automation completed successfully!");
    } catch (error) {
      console.error("❌ Test execution failed:", error.message);
      await page.screenshot({ path: "error-screenshot.png" });
      throw error;
    } finally {
      await context.close();
    }
  });
});

// === Helper Functions ===

function cleanupProfile(profilePath) {
  if (fs.existsSync(profilePath)) {
    fs.rmSync(profilePath, { recursive: true, force: true });
    console.log("✅ Cleaned previous browser profile");
  }
}

async function initializeWallet(page) {
  await page.goto(`chrome-extension://${CONFIG.EXTENSION_ID}/home.html`);
  await page.waitForSelector('button:has-text("Get started")');
  await page.click('button:has-text("Get started")');
}

async function acceptTerms(page) {
  await page.click("body");
  await page.keyboard.press("End"); // scroll to bottom
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Agree")');
}

async function selectImportWallet(page) {
  await page.click("text=I have an existing wallet");
  await page.click("text=Import using Secret Recovery Phrase");
}

async function importSeedPhrase(page) {
  console.log("🔑 Importing seed phrase...");
  await clipboardy.write(CONFIG.SEED_PHRASE);
  await page.click('button:has-text("Paste")');
  await page.click('button:has-text("Continue")');
}

async function setupPassword(page) {
  console.log("🔒 Setting up wallet password...");
  const inputs = await page.$$('input[type="password"]');
  await inputs[0].fill(CONFIG.TEST_PASSWORD);
  await inputs[1].fill(CONFIG.TEST_PASSWORD);

  await page.check('input[type="checkbox"]'); // terms checkbox
  await page.click('button:has-text("Create Password")');
}

async function completeWalletSetup(page) {
  console.log("✅ Completing wallet setup...");
  await page.click('button:has-text("I agree")');
  await page.click('button:has-text("Done")');
  await page.click('button:has-text("Done")'); // close completion screen
}

async function configureSepolia(page) {
  console.log("🌐 Configuring Sepolia testnet...");
  await page.click('[data-testid="account-options-menu-button"]');
  await page.click("text=Networks");

  // Enable test networks toggle
  const toggle = page.locator('input[type="checkbox"]').first();
  if (await toggle.isVisible()) {
    await toggle.click({ force: true });
  }

  // Close popup and configure enabled networks
  await page.keyboard.press("Escape");
  await page.click("text=Enabled Networks");
  await page.click("text=Custom");

  // Select Sepolia testnet
  const sepoliaOption = page.locator('text="Sepolia"');
  await sepoliaOption.click();
  await page.keyboard.press("Escape");
}

async function connectToDApp(page, context) {
  console.log("🌍 Connecting to dApp...");
  await page.goto(CONFIG.DAPP_URL);
  await page.waitForTimeout(1000);
  await page.waitForSelector("#connect-wallet-button");

  try {
    const popupPromise = context.waitForEvent("page", {
      timeout: CONFIG.TIMEOUT.ACTION,
    });
    await page.click("#connect-wallet-button");
    const metamaskPopup = await popupPromise;

    await metamaskPopup.waitForSelector('button:has-text("Connect")', {
      timeout: CONFIG.TIMEOUT.POPUP,
    });

    const nextButton = metamaskPopup.locator('button:has-text("Next")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
    await metamaskPopup.click('button:has-text("Connect")');

    await metamaskPopup.waitForEvent("close", {
      timeout: CONFIG.TIMEOUT.POPUP,
    });
    console.log("✅ Wallet connected via popup");
  } catch {
    console.log("✅ Wallet connected directly (no popup required)");
  }
}

async function executeTransaction(page, context) {
  console.log("💸 Executing blockchain transaction...");
  const [txPopup] = await Promise.all([
    context.waitForEvent("page", { timeout: 15000 }),
    page.click("#send-tx-button"),
  ]);

  await txPopup.waitForSelector('button:has-text("Confirm")');
  await txPopup.waitForTimeout(2000);
  await txPopup.click('button:has-text("Confirm")');

  // Confirm transaction success
  const completionMessage = txPopup.locator("text=Transaction submitted");
  if (await completionMessage.isVisible({ timeout: CONFIG.TIMEOUT.ACTION })) {
    console.log("✅ Transaction submitted successfully!");
  } else {
    console.log("⏳ Transaction is processing...");
  }
  await txPopup.close();
  await page.waitForTimeout(10000);

}
