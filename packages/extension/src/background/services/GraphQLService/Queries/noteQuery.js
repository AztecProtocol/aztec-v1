import gql from 'graphql-tag';

export default function noteQuery(requestedFields) {
    return gql`
        query note(
            $id: String!
            $domain: String!
            $currentAddress: String!
        ) {
            note(
                id: $id
                domain: $domain
                currentAddress: $currentAddress
            ) {
                note {
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
