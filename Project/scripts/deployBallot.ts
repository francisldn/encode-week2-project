import { ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import fs from "fs";
import token from "../registry.json"
// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(PRIVATE_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = ethers.providers.getDefaultProvider("ropsten");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  console.log("Deploying Ballot contract");
  const tokenAddress = token.tokenAddress;
  console.log("Proposals: ");
  const proposals = process.argv.slice(2);
  if (proposals.length < 2) throw new Error("Not enough proposals provided");
  proposals.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });
  const ballotFactory = new ethers.ContractFactory(
    ballotJson.abi,
    ballotJson.bytecode,
    signer
  );
  const ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32(proposals),
    tokenAddress
  );
  console.log("Awaiting confirmations");
  const tx = await ballotContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${ballotContract.address}`);
  const registry = {
    ballotAddress: ballotContract.address,
    tokenAddress:tokenAddress,
    network: "ropsten"
  };
  const data = JSON.stringify(registry);
  fs.writeFile("registry.json", data, (err: any) => {
    if (err) throw err;
    console.log("Ballot contract address written to file");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});