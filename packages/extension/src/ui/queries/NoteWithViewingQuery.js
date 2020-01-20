import gql from 'graphql-tag';

export default gql`
    query noteQuery($id: String!, $domain: String! $currentAddress: String!) {
        note(id: $id, domain: $domain, currentAddress: $currentAddress) {
            note {
                noteHash 
                value 
                decryptedViewingKey
                viewingKey 
                metadata
                asset {
                    address
                    linkedTokenAddress 
                }
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
