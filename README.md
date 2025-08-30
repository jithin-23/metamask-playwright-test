# Metamask Playwright Test

This project demonstrates how to automate **MetaMask wallet setup and dApp interactions** using **Playwright**.
The test covers the full flow:

1. Import a wallet using seed phrase
2. Configure the Sepolia testnet
3. Connect the wallet to a dApp
4. Approve and submit a transaction

---

## Notes & Details

* MetaMask extension is accessed in Playwright using a **custom Chromium launch with the extension loaded**.
* Currently, the test imports a **prefunded wallet via seed phrase** so transactions can be signed automatically.
* Each run creates a **fresh Chromium profile** so MetaMask setup starts clean.

  * Alternatively, you can **save a preconfigured profile** (with MetaMask already set up once) and reuse it across runs. This will speed up tests.
* ⚠️ The MetaMask **extension ID may vary** depending on your local build. Update the `EXTENSION_ID` in the test config if required.

  * A helper snippet to fetch the actual ID is included in the test file (commented).

---

## Setup

```bash
npm install
```

In a separate terminal, start the test dApp:

```bash
cd dapp
npm install
npm run dev
```

---

## Run Tests

Execute the Playwright test suite:

```bash
npx playwright test
```

### 🔎 Final Notes on Playwright + MetaMask

1. **Setup Complexity**

   * Requires downloading the MetaMask extension source and loading it manually into Chromium.
   * Need to configure a Chromium profile with the wallet seed phrase and network each time (unless a preconfigured profile is reused).
   * Slightly more involved compared to frameworks like Synpress that abstract some steps.

2. **Maintenance Burden**

   * MetaMask updates frequently → selectors or flows may break, requiring test updates.
   * Reusing a preconfigured profile reduces setup overhead but introduces version lock-in (tests may not reflect latest MetaMask UI changes).

3. **Headless Mode & Extension ID**

   * Cannot run in true headless mode because extensions and UI popups are not supported. CI/CD requires headed mode with a virtual display (e.g., `xvfb`).
   * Extension ID changes when loading from a local folder — this is expected. Workarounds include:

     * Using a discovery script to grab the actual ID each run.
     * Or reusing a preconfigured profile, where the ID stays stable.

4. **What Has Been Tested**

   * ✅ Importing a pre-funded MetaMask wallet via seed phrase.
   * ✅ Switching networks to Sepolia testnet.
   * ✅ Sending **0.01 ETH** from the wallet to a receiver address.
   * These flows confirm wallet connection, network switching, and transaction approval work in an automated test.



