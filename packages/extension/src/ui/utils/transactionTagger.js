import { utils } from 'web3';

const createNoteTopic = utils.keccak256('CreateNote(address,bytes32,bytes)');
const erc20Transfer = utils.keccak256('Transfer(address,address,uint)');
const destroyNoteTopic = utils.keccak256('DestroyNote(address,bytes32,bytes)');

// first we need to fetch the transaction
export const getTransactionReceipt = async txHash => new Promise((resolve) => {
    window.web3.eth.getTransactionReceipt(txHash, resolve);
});
const transactionTagger = async ({ logs }) => {
    const type = logs.reduce((currentType, { topics }) => {
        if (topics.indexOf(createNoteTopic) + 1 && topics.indexOf(erc20Transfer) + 1) {
            return 'DEPOSIT';
        }
        if (topics.indexOf(createNoteTopic) + 1 && topics.indexOf(destroyNoteTopic) + 1) {
            return 'SEND';
        }
        if (topics.indexOf(destroyNoteTopic) + 1 && topics.indexOf(erc20Transfer) + 1) {
            return 'WITHDRAW';
        }
    }, '');
    return type;
};

export default transactionTagger;
