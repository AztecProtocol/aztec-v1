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
    }
    type NoteAccess {
        id: ID!
        note: Note!
        account: Account!
        sharedSecret: String!
    }
    type Query {
        notes(first: Int!, id_gt: ID): [Note!]
        noteAccess(first: Int!, id_gt: ID, account: ID): [NoteAccess!]
    }
`;

export const resolvers = {
    Query: {
        notes: getNotes,
        noteAccess: getNoteAccesses,
    },
    Note: {
        asset: note => getAssetById(note.asset),
        owner: note => getAccountById(note.owner),
    },
    NoteAccess: {
        note: noteAccess => getNoteById(noteAccess.note),
        account: noteAccess => getAccountById(noteAccess.account),
    },
};
