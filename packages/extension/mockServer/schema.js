import {
    gql,
} from 'apollo-server';
import {
    getAssetById,
} from './database/asset';
import {
    getAccount,
    getAccountById,
} from './database/account';
import {
    getNotes,
    getNoteById,
} from './database/note';
import {
    getNoteAccess,
    getNoteAccesses,
    getNoteAccessById,
    getNoteChangeLog,
    grantAccess,
} from './database/noteAccess';

export const typeDefs = gql`
    type Account {
        id: ID!
        address: String!
        publicKey: String
        publicKeyCurve25519: String
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
        metadata: String!
        status: String!
    }
    type NoteAccess {
        id: ID!
        note: Note!
        account: Account!
        viewingKey: String!
    }
    type NoteChangeLog {
        id: ID!
        account: Account!
        noteAccess: NoteAccess!
        action: String!
        timestamp: Int!
    }
    type Query {
        account(id: ID!): Account
        note(id: ID!): Note
        notes(first: Int!, id_gt: ID): [Note!]
        noteAccess(id: ID, noteId: ID, account: ID): NoteAccess
        noteAccesses(first: Int!, id: ID, id_gt: ID, account: ID): [NoteAccess!]
        noteChangeLog(first: Int!, account: ID, id_gt: ID): [NoteChangeLog!]
    }
    type Mutation {
        updateNoteMetaData(_noteHash: String!, _metadata: String!): Boolean
    }
`;

export const resolvers = {
    Query: {
        account: getAccount,
        note: (_, { id }) => getNoteById(id),
        notes: getNotes,
        noteAccess: getNoteAccess,
        noteAccesses: getNoteAccesses,
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
    Mutation: {
        updateNoteMetaData: (_, {
            _noteHash,
            _metadata,
        }) => grantAccess(_noteHash, _metadata),
    },
};
