import gql from 'graphql-tag';

export default gql`
    type Account {
        id: ID!
        address: String!
    }
    type Domain {
        graphQLServer: String
    }
    type Asset {
        id: ID!
        balance: Int!
    }
    type Note {
        id: ID!
        value: Int!
        asset: Asset!
        owner: Account!
    }
    type Query {
        asset(id: ID!): Asset
        note(id: ID!): Note
    }
    type Mutation {
        enableDomain(
            domain: String!,
            graphQLServer: String!
        ): Domain
    }
`;
