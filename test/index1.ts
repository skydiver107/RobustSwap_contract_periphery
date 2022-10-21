import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory, Wallet } from "ethers";
import { Artifacts } from "hardhat/internal/artifacts";
import { Artifact } from "hardhat/types";
import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";

// import { waffle } from "hardhat";
// const { deployContract, provider, solidity, createFixtureLoader } = waffle;

// import Masterchef fom

// chai.use(solidity);
export async function getArtifact(contract: string): Promise<Artifact> {
  const artifactsPath: string =
    "/home/kts/robust/robust-periphery/artifacts/contracts";

  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifact(contract);
}

export async function getArtifact1(contract: string): Promise<Artifact> {
  const artifactsPath: string =
    "/home/kts/robust/robust-core/artifacts/contracts";

  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifact(contract);
}

describe("Swapmining", function () {
  it("Should get the reward", async function () {
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const RobustSwapArtifact = await getArtifact(
      "robust_masterchef.sol:RobustSwap"
    );
    const RBSFactory = await ethers.getContractFactoryFromArtifact(
      RobustSwapArtifact
    );
    const rbs = await RBSFactory.deploy(owner.address);
    await rbs.deployed();
    console.log("[rbs] deployed at the address <%s>", rbs.address);

    const artifact = await getArtifact(
      "robust_masterchef.sol:RobustMasterChef"
    );
    const MasterFactory = await ethers.getContractFactoryFromArtifact(artifact);
    const masterchef = await MasterFactory.deploy(
      rbs.address,
      owner.address,
      1,
      100
    );
    await masterchef.deployed();
    console.log("[masterchef] is deployed at addres <%s>", masterchef.address);

    const RobustswapERC20Artifact = await getArtifact1(
      "RobustswapERC20.sol:RobustswapERC20"
    );
    const RobustSwap20Factory = await ethers.getContractFactoryFromArtifact(
      RobustswapERC20Artifact
    );
    const robustswaperc20 = await RobustSwap20Factory.deploy();
    await robustswaperc20.deployed();
    console.log(
      "[robustswaperc20] is deployed at address <%s>",
      robustswaperc20.address
    );

    const RobustswapFactoryArtifact = await getArtifact1(
      "RobustswapFactory.sol:RobustswapFactory"
    );
    const RobustSwapFActoryFactory =
      await ethers.getContractFactoryFromArtifact(RobustswapFactoryArtifact);
    const robustswapfactory = await RobustSwapFActoryFactory.deploy(
      owner.address
    );
    await robustswapfactory.deployed();
    console.log(
      "[robustswapfactory] is deployed at address <%s>",
      robustswapfactory.address
    );

    const OracleArtifact = await getArtifact("Oracle.sol:Oracle");
    const OracleFactory = await ethers.getContractFactoryFromArtifact(
      OracleArtifact
    );
    const oracle = await OracleFactory.deploy(robustswapfactory.address);
    await oracle.deployed();

    const RouterArtifact = await getArtifact(
      "RobustswapRouter.sol:RobustswapRouter"
    );
    const RouterFactory = await ethers.getContractFactoryFromArtifact(
      RouterArtifact
    );
    const router = await RouterFactory.deploy(
      robustswapfactory.address,
      robustswaperc20.address
    );
    await router.deployed();
    console.log(
      "[robustswaprouter] is deployed at address <%s>",
      router.address
    );

    const TargetERC20Artifact = await getArtifact1(
      "RobustswapERC20.sol:RobustswapERC20"
    );
    const Target20Factory = await ethers.getContractFactoryFromArtifact(
      TargetERC20Artifact
    );
    const targeterc20 = await Target20Factory.deploy();
    await targeterc20.deployed();
    console.log(
      "[targeterc20] token is deployed at address <%s>",
      targeterc20.address
    );

    const Token0Artifact = await getArtifact(
      "MockTokenERC20.sol:MockTokenERC20"
    );
    const Token0Factory = await ethers.getContractFactoryFromArtifact(
      Token0Artifact
    );

    const token0 = await Token0Factory.deploy(
      "Token0",
      "T0",
      18,
      "100000000000000000000"
    );
    await token0.deployed();
    console.log("[token0] is deployed at address <%s>", token0.address);

    const SwapMiningArtifact = await getArtifact("SwapMining.sol:SwapMining");
    const SwapMiningFactory = await ethers.getContractFactoryFromArtifact(
      SwapMiningArtifact
    );
    const swapmining = await SwapMiningFactory.deploy(
      rbs.address,
      robustswapfactory.address,
      oracle.address,
      router.address,
      token0.address,
      1
    );
    await swapmining.deployed();

    // const Token1Artifact = await getArtifact1("ERC20.sol:ERC20");
    // const Token1Factory = await ethers.getContractFactoryFromArtifact(
    //   Token1Artifact
    // );
    const token1 = await Token0Factory.deploy(
      "Token1",
      "T1",
      18,
      "100000000000000000000"
    );
    await token1.deployed();
    console.log("token1 is deployed at address <%s>", token1.address);

    const token2 = await Token0Factory.deploy(
      "Token2",
      "T2",
      18,
      "100000000000000000000"
    );
    await token2.deployed();
    console.log("token2 is deployed at address <%s>", token2.address);

    // const LpArtifact = await getArtifact("MockTokenERC20.sol:MockTokenERC20");
    // const LpFactory = await ethers.getContractFactoryFromArtifact(LpArtifact);
    const lp = await Token0Factory.deploy(
      "LP token",
      "LP",
      18,
      "1000000000000000000"
    );
    await lp.deployed();
    console.log(
      "[lp] token for swapmining registry is deployed at address <%s>",
      lp.address
    );

    let tx = await lp.transfer(swapmining.address, "1000000000000000000");
    await tx.wait();
    const balance = await lp.balanceOf(swapmining.address);
    console.log("lp balance of swapmining is ", balance);

    tx = await swapmining.setMasterChef(masterchef.address);
    await tx.wait();
    const master = await swapmining.masterchef();
    expect(master).to.equal(masterchef.address);
    console.log("swapmining's masterchef appropriately set as ", master);

    tx = await masterchef.add(10000, lp.address, 100, 10, true);
    await tx.wait();
    const l = await masterchef.poolLength();
    console.log("masterchef.add(..) successfully conformed. poolLength is ", l);

    tx = await swapmining.setMiningPID(0);
    await tx.wait();
    const miningpid = await swapmining.miningPID();
    console.log("swapmining's [swapminingPID] is conformed as ", miningpid);

    // deposit swapmining lp token
    tx = await swapmining.mockDepositeApprove(lp.address);
    await tx.wait();
    console.log("Swapmining [mockDepositeApprove] passed");

    tx = await masterchef.updateBotGuard(0);
    await tx.wait();
    console.log("updateBotGuard is now 0");

    tx = await swapmining.mockDeposite(0);
    await tx.wait();
    console.log("swapmining.mockDeposite(0) is conformed as ");
    const masterbalance = await lp.balanceOf(masterchef.address);
    console.log("lp balance of masterchef is conformed as ", masterbalance);

    tx = await robustswapfactory.createPair(token0.address, token1.address);
    await tx.wait();

    const pair01address = await robustswapfactory.getPair(
      token0.address,
      token1.address
    );
    console.log("pair01address = ", pair01address);

    tx = await robustswapfactory.createPair(token2.address, token1.address);
    await tx.wait();

    const pair12address = await robustswapfactory.getPair(
      token1.address,
      token2.address
    );
    console.log("pair12address = ", pair12address);

    tx = await robustswapfactory.createPair(token2.address, token0.address);
    await tx.wait();

    const pair20address = await robustswapfactory.getPair(
      token2.address,
      token0.address
    );
    console.log("pair20address = ", pair20address);

    tx = await swapmining.addPair(100, pair01address, false);
    await tx.wait();
    console.log("pair01 is added to swapmining");

    tx = await swapmining.addPair(100, pair12address, false);
    await tx.wait();
    console.log("pair12 is added to swapmining");

    tx = await swapmining.addPair(100, pair12address, false);
    await tx.wait();
    console.log("pair12 is added to swapmining");

    tx = await swapmining.addWhitelist(token0.address);
    await tx.wait();

    tx = await swapmining.addWhitelist(token1.address);
    await tx.wait();

    tx = await swapmining.addWhitelist(token2.address);
    await tx.wait();
    console.log("token0, token1, token2 are whitelisted");

    tx = await masterchef.add(200, pair12address, 100, 1, false);
    await tx.wait();
    tx = await masterchef.add(200, pair20address, 100, 1, false);
    await tx.wait();
    tx = await masterchef.add(200, pair01address, 100, 1, false);
    await tx.wait();
    console.log("3 pairs are added to the masterchef");

    tx = await token0.approve(router.address, "100000000000000000000");
    await tx.wait();
    tx = await token1.approve(router.address, "100000000000000000000");
    await tx.wait();
    tx = await token2.approve(router.address, "100000000000000000000");
    await tx.wait();
    console.log("tokens are approved to router");

    tx = await router.addLiquidity(
      token1.address,
      token2.address,
      "10000000000000000000",
      "10000000000000000000",
      "10000000000000000000",
      "10000000000000000000",
      owner.address,
      "100000000000000000"
    );
    await tx.wait();

    tx = await router.addLiquidity(
      token2.address,
      token0.address,
      "10000000000000000000",
      "10000000000000000000",
      "10000000000000000000",
      "10000000000000000000",
      owner.address,
      "100000000000000000"
    );
    await tx.wait();

    tx = await router.addLiquidity(
      token0.address,
      token1.address,
      "10000000000000000000",
      "10000000000000000000",
      "10000000000000000000",
      "10000000000000000000",
      owner.address,
      "100000000000000000"
    );
    await tx.wait();

    console.log("liquidities are added to the pool");

    tx = await rbs.transferOwnership(masterchef.address);
    await tx.wait();
    console.log("transfer the rbs's owner to masterchef");

    tx = await rbs.updateRateTransferLimit(10001);
    await tx.wait();
    console.log("ratetransferlimit is disabled");

    tx = await rbs.updateTransferTaxEnabled(false);
    const istaxenabled = await rbs.transferTaxEnabled();
    console.log("istaxedenabled? ", istaxenabled);

    tx = await masterchef.setReferralCommissionRate(0);
    const ref = await masterchef.referralCommissionRate();
    console.log("referralcommisionrate is ", ref);

    tx = await swapmining.swap(
      owner.address,
      token0.address,
      token1.address,
      "1000000000000000000"
    );
    await tx.wait();
    console.log("swap conformed");

    const reward = await swapmining.getReward(owner.address);
    console.log("reward = ", reward);

    tx = await swapmining.takerWithdraw();
    await tx.wait();
    console.log("withdraw conformed");

    const pay = await rbs.balanceOf(owner.address);
    console.log("reward is now ", pay);

    // const SwapMiningArtifact = await getArtifact(
    //   "SwapMining.sol:SwapMining"
    // );
    // const SwapMiningFactory = await ethers.getContractFactoryFromArtifact(
    //   SwapMiningArtifact
    // );
    // const swapmining = await SwapMiningFactory.deploy(owner.address);
    // await swapmining.deployed();
    // ethers.getContractFactoryFromArtifact();

    // const masterchefartifact = await getArtifact("robust_masterchef");
    // console.log("masterchefartifact = ", masterchefartifact);
    // const MasterFactory = await ethers.getContractFactoryFromArtifact(masterchefartifact);
    // const masterchef = await MasterFactory.deploy()

    // const Greeter = await ethers.getContractFactory("Greeter");
    // const greeter = await Greeter.deploy("Hello, world!");
    // await greeter.deployed();

    // expect(await greeter.greet()).to.equal("Hello, world!");

    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
