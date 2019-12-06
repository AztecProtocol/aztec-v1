import gql from 'graphql-tag';

export default function accountsQuery(requestedFields) {
    return gql`
        query accounts(
            $addressArrStr: [String!]!
            $domain: String!
            $currentAddress: String!
        ) {
            accounts(
                where: {
                    address_in: $addressArrStr
                }
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
