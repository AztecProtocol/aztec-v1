import BN from 'bn.js';

export default async function getTestERC20(zkAssetAddress, iframeLog, amount = 100) {
  // use console.info here so we can log results;
  if (!zkAssetAddress) {
    iframeLog.error(new Error('Cant mint tokens. ZkAsset Address is not defined /n Make sure you assign a value to the variable "const zkAssetAddress" in the editor.'));
    return;
  }

  iframeLog.info(`Requesting ${amount} Tokens from Faucet`);

  const asset = await window.aztec.zkAsset(zkAssetAddress);
  if (!asset || !asset.valid) {
    iframeLog.error(new Error(`Invalid ZkAsset - ${zkAssetAddress}`));
    return;
  }

  if (!asset.linkedTokenAddress) {
    iframeLog.error(new Error(`Cannot mint a private ZkAsset - ${zkAssetAddress}`));
    return;
  }

  const oldBalance = await asset.balanceOfLinkedToken();
  iframeLog.info(`Old ERC20 Balance (${oldBalance.toString()})`, oldBalance);

  const {
    account,
  } = window.aztec;

  try {
    const receipt = await window.aztec.web3
      .useContract('ERC20')
      .at(asset.linkedTokenAddress)
      .method('mint')
      .send(account.address, amount);

    iframeLog.info('Transaction Sent', receipt);

    const expectedNewBalance = oldBalance.add(new BN(amount));
    const ensureBalanceUpdated = async (retry) => {
      const newBalance = await asset.balanceOfLinkedToken();
      if (newBalance.eq(expectedNewBalance)) {
        iframeLog.info(`New ERC20 Balance (${newBalance.toString()})`, newBalance);
        return null;
      }

      if (!retry) {
        return null;
      }

      return new Promise((resolve) => {
        setTimeout(async () => {
          await ensureBalanceUpdated(retry - 1);
          resolve();
        }, 2000);
      });
    };

    await ensureBalanceUpdated(30);

    iframeLog.info(`View on EtherScan https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`);
  } catch (err) {
    iframeLog.error(err);
  }
}
