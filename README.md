# Nexus Decentralized Lottery 

A fully decentralized, provably fair lottery application built on Ethereum Sepolia Testnet. This project utilizes **Chainlink VRF V2.5** (Verifiable Random Function) to guarantee tamper-proof randomness for winner selection, ensuring complete fairness and transparency.

## 🏗️ Architecture

This project is divided into two main parts:
- **`backend/`**: Contains the Solidity smart contract (`Lottery.sol`), Hardhat configuration, deployment scripts, and tests.
- **`frontend/`**: Contains the Next.js web application built with React, Tailwind CSS, Wagmi, and Viem for Web3 wallet integration.

### Tech Stack
- **Smart Contracts**: Solidity, Hardhat, Ethers.js
- **Oracle**: Chainlink VRF V2.5 (Native ETH Payment)
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Web3 Integration**: Wagmi v2, Viem, MetaMask

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MetaMask](https://metamask.io/) wallet installed in your browser.
- Sepolia Testnet ETH (Get some from the [Chainlink Faucet](https://faucets.chain.link/sepolia)).

### 2. Backend Setup (Smart Contract)

Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with the following variables:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_metamask_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
VRF_SUBSCRIPTION_ID=your_chainlink_subscription_id
```

#### Chainlink VRF Setup:
1. Go to the [Chainlink VRF Dashboard](https://vrf.chain.link/sepolia).
2. Create a new subscription and fund it with Sepolia ETH.
3. Put the Subscription ID in your `.env` file.

#### Deploying the Contract:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
*(After deploying, copy the deployed contract address and add it as a "Consumer" to your Chainlink VRF Subscription!)*

---

### 3. Frontend Setup (Web App)

Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

Update the contract address and ABI if you redeployed:
- Copy the newly generated ABI from `backend/artifacts/contracts/Lottery.sol/Lottery.json` to `frontend/src/constants/Lottery.json`.
- Update the `contractAddress` variable in `frontend/src/constants/index.ts`.

#### Running the App locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 How to Play

1. **Connect Wallet:** Click "Connect Wallet" to link your MetaMask account on the Sepolia network.
2. **Enter Lottery:** Click "Enter Lottery" to deposit the `0.001 ETH` entrance fee. This adds you to the players array and increases the Prize Pool.
3. **Draw Winner:** Anyone can click "Draw Winner". This triggers `performUpkeep` on the smart contract, requesting a random number from Chainlink.
4. **Winner Selection:** The Chainlink node processes the request and calls `fulfillRandomWords` on the contract. The contract uses modulo arithmetic to pick a winner from the array and automatically transfers the entire ETH prize pool to their wallet!

## ⚠️ Important Notes on Chainlink VRF Gas
The `callbackGasLimit` is optimized to `100,000` gas in this project. When you fund your Chainlink subscription, the node requires a "max cost buffer" of roughly **0.14 ETH**. Ensure your subscription balance remains above this limit to prevent your requests from getting stuck in a "Pending" state.

## License
MIT License
