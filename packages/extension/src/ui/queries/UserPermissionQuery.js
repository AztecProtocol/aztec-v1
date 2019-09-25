import gql from 'graphql-tag';

export default gql`
    query userPermission($currentAddress: String!, $domain: String!) {
            userPermission(currentAddress: $currentAddress, domain: $domain) {
                account { 
                    linkedPublicKey
                    registeredAt
                    address
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
