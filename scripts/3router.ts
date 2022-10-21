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

  const factoryaddress = "0x381cD69050F9Ecf83c9549CDc61f81f60bdec7AE";

  // deploy RobustswapRouter
  const RobustswapRouterArtifact = await getArtifact(
    "RobustswapRouter.sol:RobustswapRouter"
  );
  const RobustSwapRouterFactory = await ethers.getContractFactoryFromArtifact(
    RobustswapRouterArtifact
  );
  const robustswapRouter = await RobustSwapRouterFactory.deploy(
    factoryaddress,
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"
  );
  await robustswapRouter.deployed();
  console.log("robustswapRouter = ", robustswapRouter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
