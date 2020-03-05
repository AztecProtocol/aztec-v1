import gql from 'graphql-tag';

export default function usersQuery(requestedFields) {
    return gql`
        query usersQuery(
            $where: User_filter!
            $domain: String!
            $currentAddress: String!
        ) {
            users(
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
