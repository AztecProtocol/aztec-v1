import Web3Service from './web3service';
import IERC20 from '../../build/contracts/ERC20Mintable.json';

const web3Service = new Web3Service();

const mintERC20 = async (zkAssetAddress, iframeLog) => {
  // use console.info here so we can log results;
  if (!zkAssetAddress) {
    iframeLog.error(new Error('Cant mint tokens. Zk Asset Address is not defined /n Make sure you call name the variable "const zkAssetAddress" in the editor'));
    return;
  }

  await web3Service.init();
  iframeLog.info('Requesting 200 Tokens from Faucet');
  await window.aztec.enable();
  const { balanceOfLinkedToken, linkedTokenAddress } = await window.aztec.zkAsset(zkAssetAddress);
  const oldBalance = await balanceOfLinkedToken();
  iframeLog.info('Old ERC20 Balance', oldBalance);
  const {
    account,
  } = web3Service;
  web3Service.registerInterface(
    IERC20,
    {
      name: 'ERC20Mintable',
    }
  );
  try {
    const receipt = await web3Service
      .useContract('ERC20Mintable')
      .at(linkedTokenAddress)
      .method('mint')
      .send(account.address, 200);

    iframeLog.info('Transaction Sent', receipt);
    iframeLog.info(`View on EtherScan https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`);
  } catch (err) {
    iframeLog.error(err);
  }
};
export default mintERC20;
