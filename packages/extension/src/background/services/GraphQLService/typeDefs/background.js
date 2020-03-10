import gql from 'graphql-tag';
import base from './base';

const backgroundTypes = gql`
    type AssetApiResponse {
        asset: Asset
        error: Error
        action: Action
    }
    type AccountApiResponse {
        account: Account
        error: Error
        action: Action
    }
    type UsersApiResponse {
        accounts: [User!]
        error: Error
    }
    type AccountsApiResponse {
        accounts: [Account!]
        error: Error
        action: Action
    }
    type NoteApiResponse {
        note: Note
        error: Error
        action: Action
    }
    type UserAccountApiResponse {
        account: User
        error: Error
    }
    type PermissionApiResponse {
        account: User
        error: Error
        action: Action
    }
    extend type Query {
        user(
            id: ID
            currentAddress: String!
            domain: String!
        ): UserAccountApiResponse
        users(
            where: User_filter!
            currentAddress: String!
            domain: String!
        ): UsersApiResponse
        asset(
            id: ID!
            currentAddress: String!
            domain: String!
        ): AssetApiResponse
        account(
            currentAddress: String!
            domain: String!
        ): AccountApiResponse
        accounts(
            where: Account_filter!
            currentAddress: String!
            domain: String!
        ): AccountsApiResponse
        note(
            id: ID!
            currentAddress: String!
            domain: String!
        ): NoteApiResponse
        notes(
            where: Note_filter!
        ): NotesApiResponse
        pickNotesFromBalance(
            assetId: ID!
            amount: Int!
            owner: String
            numberOfNotes: Int
            excludedNotes: [Input_excluded_note!]
        ): NotesApiResponse
        fetchNotesFromBalance(
            assetAddress: String!
            equalTo: Int,
            greaterThan: Int,
            lessThan: Int,
            numberOfNotes: Int
            currentAddress: String!
            domain: String!
        ): NotesApiResponse
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
        ): ValidationApiResponse
    }
`;

export default [
    base,
    backgroundTypes,
];
