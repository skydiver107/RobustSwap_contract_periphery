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

  const TokenArtifact = await getArtifact("MockTokenERC20.sol:MockTokenERC20");
  const lpaddress = "0xE091f4aC370174f6c0f9616f2bA457aa829EB1B3";
  const lp = await ethers.getContractAtFromArtifact(
    TokenArtifact,
    lpaddress,
    owner
  );

  const SwapminingArtifact = await getArtifact("SwapMining.sol:SwapMining");
  const swapminingaddress = "0x9BD0Ddb9Fa054248b750006A2E0B14A948B9496b";
  const swapmining = await ethers.getContractAtFromArtifact(
    SwapminingArtifact,
    swapminingaddress,
    owner
  );

  const MasterchefArtifact = await getArtifact(
    "robust_masterchef.sol:RobustMasterChef"
  );
  const masterchefaddress = "0x5d987D301392a06E8A20bd7C96228201DE5312B6";
  const masterchef = await ethers.getContractAtFromArtifact(
    MasterchefArtifact,
    masterchefaddress,
    owner
  );

  // transfer lp to swapmining contract
  let tx = await lp.transfer(swapmining.address, "1000000000000000000");
  await tx.wait();
  let lpbalance = await lp.balanceOf(swapmining.address);
  console.log("lpbalance of swapmining = ", lpbalance);

  // set masterchef address to the swapmining
  tx = await swapmining.setMasterChef(masterchef.address);
  await tx.wait();

  // set the pool for swapmining
  tx = await masterchef.add(10000, lp.address, 100, 2, false);
  await tx.wait();
  let poollength = await masterchef.poolLength();
  console.log("poollength for swapmining = ", poollength);

  // set the pid 0
  tx = await swapmining.setMiningPID(8);
  await tx.wait();

  // deposit swapmining lp token
  tx = await swapmining.mockDepositeApprove(lp.address);
  await tx.wait();
  tx = await swapmining.mockDeposite(8);
  await tx.wait();
  lpbalance = await lp.balanceOf(masterchef.address);
  console.log("lpbalance of masterchef = ", lpbalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
