import Web3ServiceFactory from './factory';


export default function create(networkId) {
    return Web3ServiceFactory.create(networkId);
}
