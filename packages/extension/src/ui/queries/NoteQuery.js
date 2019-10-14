import gql from 'graphql-tag';

export default gql`
    query noteQuery($id: String!, $domain: String! $currentAddress: String!) {
        note(id: $id, domain: $domain, currentAddress: $currentAddress) {
            note {
                hash 
                value 
                owner {
                    address
                }
                status
            }
            error {
                type
                key
                message
                response
            }
        }
      }
    `;
