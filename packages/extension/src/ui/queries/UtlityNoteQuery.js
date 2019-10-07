import gql from 'graphql-tag';

export default gql`


utilityNote(id: "${confidentialTotalMinted}") {
    note {
        decryptedViewingKey
    }
    error {
        type
        key
        message
        response
    }
}
query user($id: string!, $domain: string! $currentaddress: string!) {
    user(id: $id, domain: $domain, currentaddress: $currentaddress) {
        account {
            id
            linkedpublickey
            spendingpublickey
            address
        } 
        error
    }
  }
`;
