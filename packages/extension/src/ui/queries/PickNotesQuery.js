import gql from 'graphql-tag';

export default gql`
   query pickNotesFromBalance(
        $assetId: String!,
        $domain: String!,
        $currentAddress: String!,
        $amount: Int!,
        $owner: String!,
        $numberOfNotes: Int!
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
