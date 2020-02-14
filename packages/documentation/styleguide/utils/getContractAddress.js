import { getContractAddressesForNetwork, NetworkId } from '@aztec/contract-addresses';

export default function getContractAddress(contractName) {
  const contractAddresses = getContractAddressesForNetwork(NetworkId.Rinkeby);
  return contractAddresses[contractName];
}
