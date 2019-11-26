import gql from 'graphql-tag';

export default gql`
    query fetchNotesFromBalance(
          $assetAddress: String!,
          $domain: String!,
          $currentAddress: String!,
          $equalTo: Int,
          $greaterThan: Int,
          $lessThan: Int,
          $owner: String!,
          $numberOfNotes: Int,
          $allowLessNumberOfNotes: Boolean
    ) {
        fetchNotesFromBalance(
            domain: $domain,
            currentAddress: $currentAddress,
            assetId: $assetAddress,
            equalTo: $equalTo,
            greaterThan: $greaterThan,
            lessThan: $lessThan,
            owner: $owner,
            numberOfNotes: $numberOfNotes,
            allowLessNumberOfNotes: $allowLessNumberOfNotes
        ) {
            notes {
                value
                decryptedViewingKey
                noteHash
                metadata
                status
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
