import gql from 'graphql-tag';

export default gql`
  mutation registerExtension($password: String!, $salt: String!, $domain: String!, $address: String!) {
    registerExtension(password: $password, salt: $salt, domain: $domain, address: $address) {
        account {
            linkedPublicKey
            registered
        }
    }
  }
`;
