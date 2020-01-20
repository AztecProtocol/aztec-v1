import gql from 'graphql-tag';

export default function accountsQuery(requestedFields) {
    return gql`
        query accounts(
            $where: Account_filter!
            $domain: String!
            $currentAddress: String!
        ) {
            accounts(
                where: $where
                domain: $domain
                currentAddress: $currentAddress
            ) {
                accounts {
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
