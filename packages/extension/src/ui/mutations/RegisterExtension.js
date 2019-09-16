import gql from 'graphql-tag';

export default gql`
  mutation registerExtension($password: String!, $salt: String!, $domain: String!, $address: String!, $seedPhrase: String!) {
    registerExtension(password: $password, salt: $salt, domain: $domain, address: $address, seedPhrase: $seedPhrase) {
        account {
            linkedPublicKey
            blockNumber
        }
    }
  }
`;
