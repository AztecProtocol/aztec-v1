import { abi } from './abi';

export const eth = web3 => ({
    abi: abi(web3),
    getBlockNumber: () => web3.eth.getBlockNumber(),
    getPastLogs: options => web3.eth.getPastLogs(options),
});
