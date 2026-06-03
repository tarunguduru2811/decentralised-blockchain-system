import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const chainId = hre.network.config.chainId;
  console.log("Chain ID:", chainId);
  
  let vrfCoordinatorAddress;
  let subscriptionId;
  const entranceFee = ethers.parseEther("0.001");
  // Sepolia 150 gwei lane for VRF 2.5
  let gasLane = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"; 
  const callbackGasLimit = 100000;

  if (chainId === 31337 || chainId === undefined) {
    // Local Hardhat Network: Deploy Mock
    const baseFee = ethers.parseEther("0.25");
    const gasPriceLink = 1e9;
    const weiPerUnitLink = 4e15;
    
    const VRFCoordinatorV2_5Mock = await ethers.getContractFactory("VRFCoordinatorV2_5Mock");
    const vrfCoordinatorV2Mock = await VRFCoordinatorV2_5Mock.deploy(baseFee, gasPriceLink, weiPerUnitLink);
    await vrfCoordinatorV2Mock.waitForDeployment();

    vrfCoordinatorAddress = await vrfCoordinatorV2Mock.getAddress();
    
    // Create subscription
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.logs[0].args.subId;
    
    // Fund subscription
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.parseEther("100"));
    
    console.log("Deployed VRFCoordinatorV2_5Mock at:", vrfCoordinatorAddress);
    
    // Use any bytes32 for local testing
    gasLane = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  } else {
    // Sepolia addresses for VRF 2.5
    vrfCoordinatorAddress = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
    subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID || "1");
  }

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    vrfCoordinatorAddress,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit
  );

  await lottery.waitForDeployment();
  const lotteryAddress = await lottery.getAddress();
  
  console.log("Lottery deployed to:", lotteryAddress);

  if (chainId === 31337 || chainId === undefined) {
    // Add consumer to mock
    const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2_5Mock", vrfCoordinatorAddress);
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lotteryAddress);
    console.log("Added lottery to VRF mock consumers");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
