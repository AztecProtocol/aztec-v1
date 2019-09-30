import gql from 'graphql-tag';

export default gql`
  mutation registerAddress($domain: String!, $address: String!, $spendingPublicKey: String!, $linkedPublicKey: String!, $blockNumber: Int) {
    registerAddress(domain: $domain, address: $address, spendingPublicKey: $spendingPublicKey,linkedPublicKey: $linkedPublicKey, blockNumber: $blockNumber) {
         account {
            address
            linkedPublicKey
            spendingPublicKey
            blockNumber
        }
    }
  }
`;
