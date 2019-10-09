import Web3ServiceFactory from './factory';

export default function create(networkId, account) {
    return Web3ServiceFactory.create(networkId, account);
}
