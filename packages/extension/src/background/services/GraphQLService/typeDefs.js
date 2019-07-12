import gql from 'graphql-tag';

export default gql`
    enum ErrorType {
        PERMISSION
        ARGUMENTS
    }
    type Error {
        type: ErrorType!
        key: String!
        message: String!
    }
    type Account {
        id: ID!
        address: String!
    }
    type Domain {
        graphQLServer: String
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
        asset(id: ID!): Asset
        note(id: ID!): Note
        requestGrantAccess(
            noteId: ID!
            address: String!
        ): RequestGrantAccess
    }
    type Mutation {
        enableDomain(
            domain: String!,
            graphQLServer: String!
        ): Domain
    }
`;
