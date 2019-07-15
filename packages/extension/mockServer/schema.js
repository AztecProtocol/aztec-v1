import {
    gql,
} from 'apollo-server';
import {
    getAssetById,
} from './database/asset';
import {
    getAccount,
    getAccountById,
    getAccounts,
} from './database/account';
import {
    getNotes,
    getNoteById,
} from './database/note';
import {
    getNoteAccess,
    getNoteAccesses,
    getNoteAccessById,
    getNoteChangeLogs,
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
    input AccountsWhere {
        id: ID
        id_in: [ID!]
        address: String
        address_in: [String!]
    }
    input NoteAccessesWhere {
        id: ID
        id_lt: ID
        id_gt: ID
        note: ID
        note_in: [ID!]
        account: ID
        account_in: [ID!]
    }
    input NoteChangeLogsWhere {
        id: ID
        id_lt: ID
        id_gt: ID
        account: ID
    }
    type Query {
        account(id: ID!): Account
        accounts(first: Int!, where: AccountsWhere): [Account!]
        note(id: ID!): Note
        notes(first: Int!, id_gt: ID): [Note!]
        noteAccess(id: ID, noteId: ID, account: ID): NoteAccess
        noteAccesses(first: Int!, where: NoteAccessesWhere): [NoteAccess!]
        noteChangeLogs(first: Int!, where: NoteChangeLogsWhere): [NoteChangeLog!]
    }
    type Mutation {
        updateNoteMetaData(_noteHash: String!, _metadata: String!): Boolean
    }
`;

export const resolvers = {
    Query: {
        account: getAccount,
        accounts: getAccounts,
        note: (_, { id }) => getNoteById(id),
        notes: getNotes,
        noteAccess: getNoteAccess,
        noteAccesses: getNoteAccesses,
        noteChangeLogs: getNoteChangeLogs,
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
