import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { Artifacts } from "hardhat/internal/artifacts";
import { Artifact } from "hardhat/types";
import { AddressZero } from "@ethersproject/constants";
import { LOADIPHLPAPI } from "dns";
import { RobustMasterChef } from "../typechain";

async function getArtifact(contract: string): Promise<Artifact> {
  const artifactsPath: string =
    "/home/kts/robust/robust-periphery/artifacts/contracts";

  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifact(contract);
}

async function getArtifact1(contract: string): Promise<Artifact> {
  const artifactsPath: string =
    "/home/kts/robust/robust-core/artifacts/contracts";

  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifact(contract);
}

async function main() {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  // robustswap deploy
  const RobustSwapArtifact = await getArtifact(
    "robust_masterchef.sol:RobustSwap"
  );
  const RBSFactory = await ethers.getContractFactoryFromArtifact(
    RobustSwapArtifact
  );
  const rbs = await RBSFactory.deploy(owner.address);
  await rbs.deployed();
  console.log("rbs = ", rbs.address);

  // const zeroAddress = "0x0000000000000000000000000000000000000000";
  // deploy masterchef
  const artifact = await getArtifact("robust_masterchef.sol:RobustMasterChef");
  const MasterFactory = await ethers.getContractFactoryFromArtifact(artifact);
  const masterchef = await MasterFactory.deploy(
    rbs.address,
    AddressZero,
    0,
    100
  );
  await masterchef.deployed();
  console.log("masterchef = ", masterchef.address);

  // deploy robustswapfactory
  const RobustSwapFactoryArtifact = await getArtifact1(
    "RobustswapFactory.sol:RobustswapFactory"
  );
  const RobustSwapFactoryFactory = await ethers.getContractFactoryFromArtifact(
    RobustSwapFactoryArtifact
  );
  const robustswapFactory = await RobustSwapFactoryFactory.deploy(
    owner.address
  );
  // const hash = await robustswapFactory.INIT_CODE_PAIR_HASH();
  // console.log("hash = ", hash);
  await robustswapFactory.deployed();
  console.log("robustswapFactory = ", robustswapFactory.address);

  // get robustswapfactory contract
  // const RobustSwapFactoryArtifact = await getArtifact1(
  //   "RobustswapFactory.sol:RobustswapFactory"
  // );
  // const factoryaddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  // const robustswapFactory = await ethers.getContractAtFromArtifact(
  //   RobustSwapFactoryArtifact,
  //   factoryaddress,
  //   owner
  // );

  // deploy RobustswapRouter
  const RobustswapRouterArtifact = await getArtifact(
    "RobustswapRouter.sol:RobustswapRouter"
  );
  const RobustSwapRouterFactory = await ethers.getContractFactoryFromArtifact(
    RobustswapRouterArtifact
  );
  const robustswapRouter = await RobustSwapRouterFactory.deploy(
    robustswapFactory.address,
    "0xd0a1e359811322d97991e03f863a0c30c2cf029c"
  );
  await robustswapRouter.deployed();
  console.log("robustswapRouter = ", robustswapRouter.address);

  // deploy oracle
  const OracleArtifact = await getArtifact("Oracle.sol:Oracle");
  const OracleFactory = await ethers.getContractFactoryFromArtifact(
    OracleArtifact
  );
  const oracle = await OracleFactory.deploy(robustswapFactory.address);
  await oracle.deployed();
  console.log("oracle = ", oracle.address);

  // deploy ERC20 tokens
  let tokens = [];
  const TokenArtifact = await getArtifact("MockTokenERC20.sol:MockTokenERC20");
  const TokenFactory = await ethers.getContractFactoryFromArtifact(
    TokenArtifact
  );

  for (let i = 0; i < 3; i++) {
    let token = await TokenFactory.deploy(
      "TokenName" + i,
      "TokenSymbol0" + i,
      18,
      "1000000000000000000000000"
    );
    await token.deployed();
    console.log("token%d = %s", i, token.address);

    tokens.push(token);
  }

  // deploy SwapMining
  const SwapMiningArtifact = await getArtifact("SwapMining.sol:SwapMining");
  const SwapMiningFactory = await ethers.getContractFactoryFromArtifact(
    SwapMiningArtifact
  );
  const swapmining = await SwapMiningFactory.deploy(
    rbs.address,
    robustswapFactory.address,
    oracle.address,
    robustswapRouter.address,
    tokens[0].address,
    0
  );
  await swapmining.deployed();
  console.log("swapmining = ", swapmining.address);

  // deploy miningverifyToken
  const lp = await TokenFactory.deploy("Minerverifyer", "MLP", 0, 1);
  await lp.deployed();
  console.log("swapminingmocktoken = ", lp.address);

  // transfer lp to swapmining contract
  let tx = await lp.transfer(swapmining.address, 1);
  await tx.wait();
  let lpbalance = await lp.balanceOf(swapmining.address);
  console.log("lpbalance of swapmining = ", lpbalance);

  // set masterchef address to the swapmining
  tx = await swapmining.setMasterChef(masterchef.address);
  await tx.wait();

  // set the pool for swapmining
  tx = await masterchef.add(100, lp.address, 100, 14 * 86400, true);
  await tx.wait();
  let poolinfo = await masterchef.poolInfo(0);
  console.log("poolinfo for swapmining = ", poolinfo);

  // deposit swapmining lp token
  tx = await swapmining.mockDepositeApprove(lp.address);
  await tx.wait();
  tx = await swapmining.mockDeposite();
  await tx.wait();
  lpbalance = await lp.balanceOf(masterchef.address);
  console.log("lpbalance of masterchef = ", lpbalance);

  // set the pid 0
  tx = await swapmining.setMiningPID(0);
  await tx.wait();

  // add the pairs to the masterchef
  // create pairs
  tx = await robustswapFactory.createPair(tokens[1].address, tokens[2].address);
  await tx.wait();
  const pair12address = await robustswapFactory.getPair(
    tokens[1].address,
    tokens[2].address
  );
  console.log("pair12address = ", pair12address);

  tx = await robustswapFactory.createPair(tokens[2].address, tokens[0].address);
  await tx.wait();
  const pair20address = await robustswapFactory.getPair(
    tokens[2].address,
    tokens[0].address
  );
  console.log("pair20address = ", pair20address);

  tx = await robustswapFactory.createPair(tokens[0].address, tokens[1].address);
  await tx.wait();
  const pair01address = await robustswapFactory.getPair(
    tokens[0].address,
    tokens[1].address
  );
  console.log("pair01address = ", pair01address);

  // add pairs to the swapmining
  tx = await swapmining.addPair(100000, pair12address, false);
  await tx.wait();
  tx = await swapmining.addPair(100000, pair20address, false);
  await tx.wait();
  tx = await swapmining.addPair(100000, pair01address, false);
  await tx.wait();

  tx = await swapmining.addWhitelist(tokens[0]);
  await tx.await();

  tx = await swapmining.addWhitelist(tokens[1]);
  await tx.await();

  tx = await swapmining.addWhitelist(tokens[2]);
  await tx.await();

  // transfer rbs ownership to masterchef
  tx = await rbs.transferOwnership(masterchef.address);
  await tx.wait();
  const rbsowner = await rbs.owner();
  console.log("rbsowner = ", rbsowner);
  // add pairs to the masterchef
  tx = await masterchef.add(20000, pair12address, 100, 14 * 86400, false);
  await tx.wait();
  tx = await masterchef.add(20000, pair20address, 100, 14 * 86400, false);
  await tx.wait();
  tx = await masterchef.add(20000, pair01address, 100, 14 * 86400, false);
  await tx.wait();
  poolinfo = await masterchef.poolInfo(0);
  console.log("poolinfo for swapmining = ", poolinfo);

  // ADD LIQUIDITY

  tx = await tokens[0].approve(robustswapRouter.address, "200000000000000");
  await tx.wait();
  tx = await tokens[1].approve(robustswapRouter.address, "200000000000000");
  await tx.wait();
  tx = await tokens[2].approve(robustswapRouter.address, "200000000000000");
  await tx.wait();

  tx = await robustswapRouter.addLiquidity(
    tokens[1].address,
    tokens[2].address,
    "10000000000000",
    "10000000000000",
    "10000000000000",
    "10000000000000",
    owner.address,
    "100000000000000000"
  );
  await tx.wait();
  console.log("11111111111111111111");

  tx = await robustswapRouter.addLiquidity(
    tokens[0].address,
    tokens[2].address,
    "10000000000000",
    "10000000000000",
    "10000000000000",
    "10000000000000",
    owner.address,
    "100000000000000000"
  );
  await tx.wait();

  tx = await robustswapRouter.addLiquidity(
    tokens[0].address,
    tokens[1].address,
    "10000000000000",
    "10000000000000",
    "10000000000000",
    "10000000000000",
    owner.address,
    "100000000000000000"
  );
  await tx.wait();

  tx = await robustswapRouter.swapExactTokensForTokens(
    "5000000000000",
    "2000000000000",
    [tokens[2].address, tokens[0].address],
    owner.address,
    "100000000000000000"
  );
  await tx.wait();

  tx = await masterchef.update();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
