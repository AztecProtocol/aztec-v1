import gql from 'graphql-tag';

export default gql`
    scalar BigInt
    enum ErrorType {
        PERMISSION
        ARGUMENTS
        TIMEOUT
        UNKNOWN
    }
    enum ActionType {
        AUTH
        ASSET
        PROOF
        UNKNOWN
    }
    type Action {
        type: ActionType!
        key: String!
    }
    type Error {
        type: ErrorType!
        key: String!
        message: String!
        response: String
    }
    type Account {
        id: ID!
        address: String!
        linkedPublicKey: String
    }
    type User {
        id: ID!
        address: String!
        spendingPublicKey: String
        linkedPublicKey: String
        lastSynced: String
        registeredAt: BigInt
    }
    type Asset {
        id: ID!
        address: String!
        balance: Int
        linkedTokenAddress: String
        scalingFactor: Int
        canAdjustSupply: Boolean
        canConvert: Boolean
    }
    type Note {
        id: ID!
        hash: String!
        asset: Asset!
        owner: Account
        viewingKey: String
        decryptedViewingKey: String
        metadata: String
        value: Int
        status: String
    }
    type UtilityNote {
        id: ID!
        hash: String!
        asset: Asset!
        metadata: String
        viewingKey: String
        decryptedViewingKey: String
    }
    type GrantNoteAccessPermission {
        prevMetadata: String
        metadata: String
        asset: Asset
    }
    input Account_filter {
        address: String
        address_in: [String!]
    }
    type AssetApiResponse {
        asset: Asset
        error: Error
        action: Action
    }
    type AccountApiResponse {
        account: Account
        error: Error
        action: Action
    }
    type AccountsApiResponse {
        accounts: [Account!]
        error: Error
        action: Action
    }
    type NoteApiResponse {
        note: Note
        error: Error
        action: Action
    }
    type NotesApiResponse {
        notes: [Note!]
        error: Error
        action: Action
    }
    type UtilityNoteApiResponse {
      note: UtilityNote
      error: Error
      action: Action
    }
    type GrantAccessApiResponse {
        permission: GrantNoteAccessPermission
        error: Error
        action: Action
    }
    type UserAccountApiResponse {
        account: User
        error: Error
    }
    type Query {
        user(
            id: ID
            currentAddress: String!
            domain: String!
        ): UserAccountApiResponse
        asset(
            id: ID!
            currentAddress: String!
            domain: String!
        ): AssetApiResponse
        account(
            currentAddress: String!
            domain: String!
        ): AccountApiResponse
        accounts(
            where: Account_filter!
            currentAddress: String!
            domain: String!
        ): AccountsApiResponse
        note(
            id: ID!
            currentAddress: String!
            domain: String!
        ): NoteApiResponse
        utilityNote(
            id: ID!
            currentAddress: String!
            domain: String!
        ): UtilityNoteApiResponse
        grantNoteAccessPermission(
            noteId: ID!
            address: String!
            currentAddress: String!
            domain: String!
        ): GrantAccessApiResponse
        pickNotesFromBalance(
            assetId: ID!
            amount: Int!
            owner: String
            numberOfNotes: Int
            currentAddress: String!
            domain: String!
        ): NotesApiResponse
    }
    type Mutation {
        root: String
    }
`;
