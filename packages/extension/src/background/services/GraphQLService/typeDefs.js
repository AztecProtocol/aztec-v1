import gql from 'graphql-tag';

export default gql`
    enum ErrorType {
        PERMISSION
        ARGUMENTS
        UNKNOWN
    }
    type Error {
        type: ErrorType!
        key: String!
        message: String!
        response: String
    }
    type Account {
        id: ID
        address: String
        linkedPublicKey: String
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
        balance: Int
    }
    type Note {
        id: ID!
        hash: String!
        asset: Asset!
        owner: Account!
        viewingKey: String
        metadata: String
        value: Int
    }
    type GrantNoteAccessPermission {
        prevMetadata: String
        metadata: String
        asset: Asset
    }
    type AssetApiResponse {
        asset: Asset
        error: Error
    }
    type NoteApiResponse {
        note: Note
        error: Error
    }
    type GrantAccessApiResponse {
        permission: GrantNoteAccessPermission
        error: Error
    }
    type AccountApiResponse {
        account: Account
        error: Error
    }
    type Query {
        asset(
            id: ID!
            currentAddress: String!
            domain: String!
        ): AssetApiResponse
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
    }
    type Mutation {
        enableAssetForDomain(
            domain: String!
            asset: String!
        ): Domain
        login(
            password: String!
            domain: String!
        ): Session
        registerExtension(
            address: String!
            password: String!
            salt: String!
            domain: String!
        ): AccountApiResponse
        registerAddress(
            address: String!
            domain: String!
        ): AccountApiResponse
    }
`;
