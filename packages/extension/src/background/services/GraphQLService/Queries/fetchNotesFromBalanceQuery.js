import gql from 'graphql-tag';

export default function fetchNotesFromBalanceQuery(requestedFields) {
    return gql`
        query fetchNotesFromBalance(
              $assetAddress: String!
              $equalTo: Int
              $greaterThan: Int
              $lessThan: Int
              $numberOfNotes: Int
              $domain: String!
              $currentAddress: String!
        ) {
            fetchNotesFromBalance(
                assetAddress: $assetAddress
                equalTo: $equalTo
                greaterThan: $greaterThan
                lessThan: $lessThan
                numberOfNotes: $numberOfNotes
                domain: $domain
                currentAddress: $currentAddress
            ) {
                notes {
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
