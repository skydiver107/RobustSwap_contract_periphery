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

  const SwapminingArtifact = await getArtifact("SwapMining.sol:SwapMining");
  const swapminingaddress = "0x9BD0Ddb9Fa054248b750006A2E0B14A948B9496b";
  const swapmining = await ethers.getContractAtFromArtifact(
    SwapminingArtifact,
    swapminingaddress,
    owner
  );

  const masterchefaddress = "0x5d987D301392a06E8A20bd7C96228201DE5312B6";

  const RBSArtifact = await getArtifact("robust_masterchef.sol:RobustSwap");
  const rbsaddress = "0x0B581fF15C80F27cb901CbaB290A51754dc99d9c";
  const rbs = await ethers.getContractAtFromArtifact(
    RBSArtifact,
    rbsaddress,
    owner
  );

  const pair12address = "0xa12E51333dDD618B55E766300EF3C0d43E775799";
  const pair20address = "0xF19D8199eC937494B6769a96A81bAC5026F11d36";
  const pair01address = "0x1DF64d2850Fdc83c990C9081eE90F22ef45085e6";
  const linkpairaddress = "0x8FDAE271a100BBd4A0eFe304daFe544Bb279a4EA";

  // add pairs to the swapmining
  let tx = await swapmining.addPair(100, pair12address, false);
  await tx.wait();
  tx = await swapmining.addPair(100, pair20address, false);
  await tx.wait();
  tx = await swapmining.addPair(100, pair01address, false);
  await tx.wait();
  tx = await swapmining.addPair(100, linkpairaddress, false);
  await tx.wait();

  tx = await swapmining.addWhitelist(
    "0xd55A571Df6543a8DE61a38240702F970b818e784"
  );
  await tx.wait();
  tx = await swapmining.addWhitelist(
    "0x8905AbFd3f7C477d6944c3855b1a7e44b0c198D0"
  );
  await tx.wait();
  tx = await swapmining.addWhitelist(
    "0xF350F5dB1ecc81246b67A8752dc35EF4b3388d11"
  );
  await tx.wait();
  tx = await swapmining.addWhitelist(
    "0xa36085F69e2889c224210F603D836748e7dC0088"
  );
  await tx.wait();
  console.log("all done");

  // // transfer rbs ownership to masterchef
  // tx = await rbs.transferOwnership(masterchefaddress);
  // await tx.wait();
  // const rbsowner = await rbs.owner();
  // console.log("rbsowner = ", rbsowner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
