import gql from 'graphql-tag';

export default gql`
    enum ErrorType {
        PERMISSION
        ARGUMENTS
    } type Error {
        type: ErrorType!
        key: String!
        message: String!
    }
    type Account {
        id: ID
        address: String
        publicKey: String!
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
        balance: Int!
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
    type RequestGrantAccess {
        error: Error
        prevMetadata: String
        metadata: String
        asset: Asset
    }
    type Query {
        requestGrantAccess(
            noteId: ID!
            address: String!
        ): RequestGrantAccess
        asset(id: ID! domain: String!): Asset
        note(id: ID! domain: String!): Note
    }
    type Mutation {
        enableAssetForDomain(
            domain: String!,
            asset: String!
        ): Domain
        login(
            password: String!,
            domain: String!
        ):Session
        registerExtension(
            password: String!
            salt: String!
            domain: String!
        ): Account
    }
`;
