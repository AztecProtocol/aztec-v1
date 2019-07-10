import {
    gql,
} from 'apollo-server';
import {
    getAssetById,
} from './database/asset';
import {
    getAccountById,
} from './database/account';
import {
    getNotes,
    getNoteById,
} from './database/note';
import {
    getNoteAccesses,
    getNoteAccessById,
    getNoteChangeLog,
} from './database/noteAccess';

export const typeDefs = gql`
    type Account {
        id: ID!
        address: String!
    }
    type Asset {
        id: ID!
        address: String!
    }
    type Note {
        id: ID!
        hash: String!
        asset: Asset!
        owner: Account!
        status: String!
    }
    type NoteAccess {
        id: ID!
        note: Note!
        account: Account!
        sharedSecret: String!
    }
    type NoteChangeLog {
        id: ID!
        account: Account!
        noteAccess: NoteAccess!
        action: String!
        timestamp: Int!
    }
    type Query {
        notes(first: Int!, id_gt: ID): [Note!]
        noteAccess(first: Int!, id_gt: ID, account: ID): [NoteAccess!]
        noteChangeLog(first: Int!, account: ID, id_gt: ID): [NoteChangeLog!]
    }
`;

export const resolvers = {
    Query: {
        notes: getNotes,
        noteAccess: getNoteAccesses,
        noteChangeLog: getNoteChangeLog,
    },
    Note: {
        asset: ({ asset }) => getAssetById(asset),
        owner: ({ owner }) => getAccountById(owner),
    },
    NoteAccess: {
        note: ({ note }) => getNoteById(note),
        account: ({ account }) => getAccountById(account),
    },
    NoteChangeLog: {
        account: ({ account }) => getAccountById(account),
        noteAccess: ({ noteAccess }) => getNoteAccessById(noteAccess),
    },
};
