import gql from 'graphql-tag';
import base from './base';

const uiTypes = gql`
    type Session {
        createdAt: Int!
        lastLogin: Int!
        pwDerivedKey: String!
    }
    type SessionApiResponse {
        session: Session
        error: Error
        action: Action
    }
    type SubscriptionApiResponse {
        success: Boolean
        error: Error
    }
    type PermissionApiResponse {
        account: User
        error: Error
        action: Action
    }
    extend type Query {
        userPermission(
            currentAddress: String!
            domain: String!
        ): PermissionApiResponse
        subscribe(
            type: String!
            requestId: String!
            assetId: ID
            noteId: ID
            currentAddress: String!
            domain: String!
        ): SubscriptionApiResponse
    }
    extend type Mutation {
        login(
            password: String!
            domain: String!
            address: String!
        ): SessionApiResponse
        registerExtension(
            password: String!
            salt: String!
            domain: String!
            address: String!
            seedPhrase: String!
        ): UserAccountApiResponse
        registerAddress(
            address: String!
            linkedPublicKey: String!
            blockNumber: BigInt
        ): UserAccountApiResponse
        registerDomain(
            domain: String!
            currentAddress: String!
        ): SubscriptionApiResponse 
    }
`;

export default [
    base,
    uiTypes,
];
