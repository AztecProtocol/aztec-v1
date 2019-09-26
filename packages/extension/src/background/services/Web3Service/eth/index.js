import { abi } from './abi'

export const eth = (web3) => ({
    abi: abi(web3),
    getBlockNumber: () => {
        return web3.eth.getBlockNumber();
    },
    getPastLogs: (options) => {
        return web3.eth.getPastLogs(options);
    }
})