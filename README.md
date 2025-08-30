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

