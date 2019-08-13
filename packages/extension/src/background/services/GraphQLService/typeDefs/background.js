import gql from 'graphql-tag';
import base from './base';

const backgroundTypes = gql`
    type PermissionApiResponse {
        account: User
        error: Error
        action: Action
    }
    type SubscriptionApiResponse {
        success: Boolean
        error: Error
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
`;

export default [
    base,
    backgroundTypes,
];
