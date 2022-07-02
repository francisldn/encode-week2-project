import { ethers } from "ethers";
import "dotenv/config";
import * as tokenJson from "../artifacts/contracts/Token.sol/MyToken.json";
import fs from "fs";
// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(PRIVATE_KEY);
  console.log(`Using address ${wallet.address}`);
  // const provider = ethers.providers.getDefaultProvider("ropsten");
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ROPSTEN_URL
  );
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  console.log("Deploying Token contract");

  const tokenFactory = new ethers.ContractFactory(
    tokenJson.abi,
    tokenJson.bytecode,
    signer
  );
  const tokenContract = await tokenFactory.deploy();
  console.log("Awaiting confirmations");
  const tx = await tokenContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${tokenContract.address}`);
  const registry = {
    tokenAddress: tokenContract.address,
    network: "ropsten",
  };
  const data = JSON.stringify(registry);
  fs.writeFile("registry.json", data, (err: any) => {
    if (err) throw err;
    console.log("Token contract address written to file");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
