import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Lottery", function () {
  let lottery, vrfMock, deployer, player1, player2;
  const entranceFee = ethers.parseEther("0.001");

  beforeEach(async function () {
    [deployer, player1, player2] = await ethers.getSigners();

    const baseFee = ethers.parseEther("0.25");
    const gasPriceLink = 1e9;
    const weiPerUnitLink = 4e15;

    const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2_5Mock");
    vrfMock = await VRFMock.deploy(baseFee, gasPriceLink, weiPerUnitLink);
    await vrfMock.waitForDeployment();

    const tx = await vrfMock.createSubscription();
    const receipt = await tx.wait(1);
    const subId = receipt.logs[0].args.subId;
    await vrfMock.fundSubscriptionWithNative(subId, { value: ethers.parseEther("100") });

    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(
      await vrfMock.getAddress(),
      entranceFee,
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
      subId,
      500000
    );
    await lottery.waitForDeployment();

    await vrfMock.addConsumer(subId, await lottery.getAddress());
  });

  it("Should allow a player to enter", async function () {
    await lottery.connect(player1).enterLottery({ value: entranceFee });
    const playerFromContract = await lottery.getPlayer(0);
    expect(playerFromContract).to.equal(player1.address);
  });

  it("Should pick a winner and send funds", async function () {
    await lottery.connect(player1).enterLottery({ value: entranceFee });
    await lottery.connect(player2).enterLottery({ value: entranceFee });

    const tx = await lottery.performUpkeep();
    const receipt = await tx.wait(1);
    
    // In VRF V2.5, the event might be different or the request ID is in the mock logs
    // Let's get it from the Lottery contract's RequestedLotteryWinner event
    const requestId = receipt.logs.find(log => log.fragment && log.fragment.name === 'RequestedLotteryWinner').args[0];

    // Note: fulfillRandomWords in Mock takes requestId and consumerAddress
    // In V2.5 Mock, it might just take requestId and consumerAddress or (requestId, consumer, and something else)
    // Actually VRFCoordinatorV2_5Mock uses: fulfillRandomWords(uint256 _requestId, address _consumer)
    await expect(
      vrfMock.fulfillRandomWords(requestId, await lottery.getAddress())
    ).to.emit(lottery, "WinnerPicked");

    const recentWinner = await lottery.getRecentWinner();
    expect(recentWinner).to.be.oneOf([player1.address, player2.address]);
    expect(await lottery.getLotteryState()).to.equal(0); // OPEN
    expect(await lottery.getNumberOfPlayers()).to.equal(0);
  });
});
