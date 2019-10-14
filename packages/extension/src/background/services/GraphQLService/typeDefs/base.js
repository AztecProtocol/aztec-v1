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
        blockNumber: BigInt
    }
    type Asset {
        id: ID!
        address: String!
        balance: Int
        linkedTokenAddress: String
        scalingFactor: BigInt
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
    type NotesApiResponse {
        notes: [Note!]
        error: Error
        action: Action
    }
    type ValidationApiResponse {
        success: Boolean
        error: Error
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
    type Query {
        root: String
    }
    type Mutation {
        root: String
    }
`;
