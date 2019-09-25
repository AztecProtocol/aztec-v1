import gql from 'graphql-tag';

export default gql`
query user($id: String!, $domain: String! $currentAddress: String!) {
    user(id: $id, domain: $domain, currentAddress: $currentAddress) {
        account {
            id
            linkedPublicKey
            spendingPublicKey
            address
        } 
        error
    }
  }
`;
