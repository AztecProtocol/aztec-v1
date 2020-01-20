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
`;

export default [
    base,
    uiTypes,
];
