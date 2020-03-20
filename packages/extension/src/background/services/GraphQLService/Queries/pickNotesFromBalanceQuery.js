import gql from 'graphql-tag';

export default function pickNotesFromBalanceQuery(requestedFields) {
    return gql`
        query pickNotesFromBalanceQuery(
            $assetId: String!
            $amount: Int!
            $owner: String!
            $numberOfNotes: Int
            $excludedNotes: [Input_excluded_note!]
        ) {
            pickNotesFromBalance(
                assetId: $assetId,
                amount: $amount,
                owner: $owner,
                numberOfNotes: $numberOfNotes
                excludedNotes: $excludedNotes
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
