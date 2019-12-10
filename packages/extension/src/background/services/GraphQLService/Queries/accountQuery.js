import gql from 'graphql-tag';

export default function accountQuery(requestedFields) {
    return gql`
        query accountQuery(
            $domain: String!
            $currentAddress: String!
        ) {
            account(
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
