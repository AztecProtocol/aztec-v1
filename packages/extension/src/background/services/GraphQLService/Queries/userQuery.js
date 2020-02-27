import gql from 'graphql-tag';

export default function userQuery(requestedFields) {
    return gql`
        query userQuery(
            $id: String!
            $domain: String!
            $currentAddress: String!
        ) {
            user(
                id: $id
                domain: $domain
                currentAddress: $currentAddress
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
