import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

function App() {
  const [account, setAccount] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [network, setNetwork] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected!");
      return;
    }
    const [selectedAccount] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(selectedAccount);
    // switchToSepolia();
    await fetchNetwork();
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID in hex
      });
      console.log("Switched to Sepolia!");
    } catch (switchError) {
      // If network is not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Test Network",
              rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_KEY"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        console.error(switchError);
      }
    }
  };

  const fetchNetwork = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    setNetwork(net);
  };

  const sendTransaction = async () => {
    if (!account) return alert("Connect wallet first!");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    try {
      const tx = await signer.sendTransaction({
        to: "0xcf9D4AF9f5A054ddf211CA2fEa615d2e43a45AAC", // replace with test recipient
        value: ethers.parseEther("0.001"),
        gasLimit: 21000, // ensure ETH transfer works
      });
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  };

  // Detect network/account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => fetchNetwork();
    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || null);

    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Minimal MetaMask DApp</h1>

      <button onClick={connectWallet} id="connect-wallet-button">
        {account ? `Connected: ${account.slice(0, 6)}...` : "Connect Wallet"}
      </button>

      <p>
        Current Network:{" "}
        {network
          ? network.name + ` (Chain ID: ${network.chainId})`
          : "Not connected"}
      </p>

      <button onClick={sendTransaction} id="send-tx-button">
        Send Test Transaction
      </button>
      {txHash && (
        <p>
          Transaction sent! Hash: <code>{txHash}</code>
        </p>
      )}
    </div>
  );
}

export default App;
