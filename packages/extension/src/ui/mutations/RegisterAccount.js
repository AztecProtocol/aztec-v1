import gql from 'graphql-tag';

export default gql`
  mutation registerAddress($domain: String!, $address: String!, $spendingPublicKey: String!, $linkedPublicKey: String!, $registeredAt: BigInt) {
    registerAddress(domain: $domain, address: $address, spendingPublicKey: $spendingPublicKey,linkedPublicKey: $linkedPublicKey, blockNumber: $registeredAt) {
         account {
            address
            linkedPublicKey
            spendingPublicKey 
            blockNumber
        }
    }
  }
`;
