import gql from 'graphql-tag';

export default function pickNotesFromBalanceQuery(requestedFields) {
    return gql`
        query pickNotesFromBalanceQuery(
            $assetId: String!,
            $amount: Int!,
            $owner: String!,
            $numberOfNotes: Int
            $domain: String!
            $currentAddress: String!
        ) {
            pickNotesFromBalance(
                domain: $domain,
                currentAddress: $currentAddress,
                assetId: $assetId,
                amount: $amount,
                owner: $owner,
                numberOfNotes: $numberOfNotes
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
