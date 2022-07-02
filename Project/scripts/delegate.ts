import { ethers } from "ethers"; // dont need to ship hardhat ethers, raw ethers is OK
import "dotenv/config";
import * as tokenJson from "../artifacts/contracts/Token.sol/MyToken.json";
import token from "../registry.json";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

// Address of deployed Token.sol on Rinkeby
const tokenAddress = token.tokenAddress;

async function main() {
  // create wallet and connect to provider
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

  // get contract instance at the right address
  const tokenContract = new ethers.Contract(
    tokenAddress,
    tokenJson.abi,
    signer
  );

  // delegate votes to self
  
  const transactionResponse = await tokenContract.delegate(wallet.address);
  const txResponse = transactionResponse.wait(); // wait for transaction to be mined
  console.log(`Transaction hash for delegate vote: ${txResponse.hash}`)
  const delegatingTo = await tokenContract.delegates(wallet.address);
  console.log(`${wallet.address} delegated to ${delegatingTo.toString()}`);

  // do a transfer to update the snapshot
  const account2 = "0xb2cddF705eA6f12D7B5Da081F679305A3209Af99";
  const tx = await tokenContract.transfer(
    account2,
    ethers.utils.parseEther("10")
  );
  tx.wait(1);
  const txHash = tx.hash;
  console.log(`Transaction hash: ${txHash}`)

  // get and print updates number of votes
  const numVotes = await tokenContract.getVotes(wallet.address);
  console.log(`${wallet.address} has ${numVotes} votes`);
  console.log("-----------------------------------------------------");
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});