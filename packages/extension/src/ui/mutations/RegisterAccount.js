import gql from 'graphql-tag';

export default gql`
  mutation registerAddress($domain: String!, $address: String!, $linkedPublicKey: String!, $blockNumber: BigInt) {
    registerAddress(domain: $domain, address: $address, linkedPublicKey: $linkedPublicKey, blockNumber: $blockNumber) {
         account {
            address
            linkedPublicKey
            blockNumber
        }
    }
  }
`;
