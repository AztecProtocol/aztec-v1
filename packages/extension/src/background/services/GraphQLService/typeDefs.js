import gql from 'graphql-tag';

export default gql`
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
    }
    type User {
        id: ID!
        address: String!
        spendingPublicKey: String
        linkedPublicKey: String
        lastSynced: String
    }

    type Domain {
        assets: [Asset!]
    }
    type Session {
        createdAt: Int!
        lastLogin: Int!
        pwDerivedKey: String!
    }
    type Asset {
        id: ID!
        address: String!
        linkedTokenAddress: String
        balance: Int
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
    type GrantNoteAccessPermission {
        prevMetadata: String
        metadata: String
        asset: Asset
    }
    type AssetApiResponse {
        asset: Asset
        error: Error
        action: Action
    }
    type AccountApiResponse {
        account: User 
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
            currentAddress: String!  domain: String!
        ): AssetApiResponse
        account(
            currentAddress: String!
            domain: String!
        ): AccountApiResponse 
        note(
            id: ID!
            currentAddress: String!
            domain: String!
        ): NoteApiResponse
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
        createNoteFromBalance(
            assetId: ID!
            amount: Int!
            owner: String
            userAccess: String
            currentAddress: String!
            domain: String!
        ): NoteApiResponse
    }
    type Mutation {
        login(
            password: String!
            domain: String!
        ): Session
        registerExtension(
            password: String!
            salt: String!
            domain: String!
            address: String!
        ): UserAccountApiResponse
        registerAddress(
            address: String!
            domain: String!
        ): UserAccountApiResponse
        enableAssetForDomain(
            domain: String!
            asset: String!
        ): AssetApiResponse
    }
`;
