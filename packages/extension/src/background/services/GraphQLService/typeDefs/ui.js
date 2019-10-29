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
    type UserAccountApiResponse {
        account: Account
        error: Error
    }
    extend type Query {
        user(
            id: ID!
        ): User
        asset(
            id: ID!
        ): Asset 
        account( 
            address: String!
        ): UserAccountApiResponse 
        note(
            id: ID!
        ): Note
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
            spendingPublicKey: String!
            blockNumber: BigInt
        ): UserAccountApiResponse
        registerDomain(
            domain: String!
            currentAddress: String!
        ): ValidationApiResponse
    }
`;

export default [
    base,
    uiTypes,
];
