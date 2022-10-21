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

  const MasterchefArtifact = await getArtifact(
    "robust_masterchef.sol:RobustMasterChef"
  );
  const masterchefaddress = "0x5d987D301392a06E8A20bd7C96228201DE5312B6";
  const masterchef = await ethers.getContractAtFromArtifact(
    MasterchefArtifact,
    masterchefaddress,
    owner
  );

  const pair12address = "0xa12E51333dDD618B55E766300EF3C0d43E775799";
  const pair20address = "0xF19D8199eC937494B6769a96A81bAC5026F11d36";
  const pair01address = "0x1DF64d2850Fdc83c990C9081eE90F22ef45085e6";

  // add pairs to the masterchef
  let tx = await masterchef.add(200, pair12address, 100, 14 * 86400, false);
  await tx.wait();
  tx = await masterchef.add(200, pair20address, 100, 14 * 86400, false);
  await tx.wait();
  tx = await masterchef.add(200, pair01address, 100, 14 * 86400, false);
  await tx.wait();
  let poolinfo = await masterchef.poolInfo(0);
  console.log("poolinfo for swapmining = ", poolinfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
