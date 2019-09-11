import Web3Service from '~client/services/Web3Service';

const sendTransaction = ({ contract, method, params }) =>
// TODO change this to use the gas station network
    Web3Service
        .useContract(contract)
        .method(method)
        .send(...params);
