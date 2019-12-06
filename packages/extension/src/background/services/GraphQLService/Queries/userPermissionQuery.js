import gql from 'graphql-tag';

export default function userPermissionQuery(requestedFields) {
    return gql`
        query userPermission(
            $currentAddress: String!
            $domain: String!
        ) {
            userPermission(
                currentAddress: $currentAddress
                domain: $domain
            ) {
                account {
                    ${requestedFields}
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
}
