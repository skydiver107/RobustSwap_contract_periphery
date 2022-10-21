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

  // get robustswapfactory contract
  // const RobustSwapFactoryArtifact = await getArtifact1(
  //   "RobustswapFactory.sol:RobustswapFactory"
  // );
  // const factoryaddress = "0x41B56a0C10b5036Eb043D99Ce65fD6e1B1C0d8B5";
  // const robustswapFactory = await ethers.getContractAtFromArtifact(
  //   RobustSwapFactoryArtifact,
  //   factoryaddress,
  //   owner
  // );

  // deploy ERC20 tokens
  // let tokens = [];
  const TokenArtifact = await getArtifact("MockTokenERC20.sol:MockTokenERC20");
  const TokenFactory = await ethers.getContractFactoryFromArtifact(
    TokenArtifact
  );

  // for (let i = 0; i < 3; i++) {
  //   let token = await TokenFactory.deploy(
  //     "TokenName" + i,
  //     "TokenSymbol0" + i,
  //     18,
  //     "1000000000000000000000000"
  //   );
  //   await token.deployed();
  //   console.log("token%d = %s", i, token.address);

  //   tokens.push(token);
  // }

  // deploy miningverifyToken
  const lp = await TokenFactory.deploy(
    "Minerverifyer",
    "MLP",
    18,
    "10000000000000000000"
  );
  await lp.deployed();
  console.log("swapminingmocktoken = ", lp.address);

  // add the pairs to the masterchef
  // create pairs
  // let tx = await robustswapFactory.createPair(
  //   tokens[1].address,
  //   tokens[2].address
  // );
  // await tx.wait();
  // const pair12address = await robustswapFactory.getPair(
  //   tokens[1].address,
  //   tokens[2].address
  // );
  // console.log("pair12address = ", pair12address);

  // tx = await robustswapFactory.createPair(tokens[2].address, tokens[0].address);
  // await tx.wait();
  // const pair20address = await robustswapFactory.getPair(
  //   tokens[2].address,
  //   tokens[0].address
  // );
  // console.log("pair20address = ", pair20address);

  // tx = await robustswapFactory.createPair(tokens[0].address, tokens[1].address);
  // await tx.wait();
  // const pair01address = await robustswapFactory.getPair(
  //   tokens[0].address,
  //   tokens[1].address
  // );
  // console.log("pair01address = ", pair01address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
