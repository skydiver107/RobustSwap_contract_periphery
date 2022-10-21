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

  // deploy SwapMining
  const rbsaddress = "0x95336aC5f7E840e7716781313e1607F7C9D6BE25";
  const robustswapfactoryaddress = "0x381cD69050F9Ecf83c9549CDc61f81f60bdec7AE";
  const oracleaddress = "0x0963A32d17581C45d1BdB5Df66940E5255d2B423";
  const routeraddress = "0x10Ae01d3B3A48F33D841DA0dF586DC1d87c285d8";
  const targettokenaddress = "0x55d398326f99059fF775485246999027B3197955";

  const SwapMiningArtifact = await getArtifact("SwapMining.sol:SwapMining");
  const SwapMiningFactory = await ethers.getContractFactoryFromArtifact(
    SwapMiningArtifact
  );
  const swapmining = await SwapMiningFactory.deploy(
    rbsaddress,
    robustswapfactoryaddress,
    oracleaddress,
    routeraddress,
    targettokenaddress,
    0
  );
  await swapmining.deployed();
  console.log("swapmining = ", swapmining.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
