import gql from 'graphql-tag';

export default gql`
  mutation registerAddress($domain: String!, $address: String!, $linkedPublicKey: String!, $registeredAt: BigInt) {
    registerAddress(domain: $domain, address: $address, linkedPublicKey: $linkedPublicKey, registeredAt: $registeredAt) {
         account {
            address
            linkedPublicKey
            registeredAt
        }
    }
  }
`;
