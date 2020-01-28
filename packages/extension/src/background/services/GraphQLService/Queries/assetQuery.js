import gql from 'graphql-tag';

export default function assetQuery(requestedFields) {
    return gql`
        query asset(
            $id: String!
            $domain: String!
            $currentAddress: String!
        ) {
            asset(
                id: $id
                domain: $domain
                currentAddress: $currentAddress
            ) {
                asset {
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
