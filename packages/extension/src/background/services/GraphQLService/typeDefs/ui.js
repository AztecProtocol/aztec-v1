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
            registeredAt: BigInt
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
