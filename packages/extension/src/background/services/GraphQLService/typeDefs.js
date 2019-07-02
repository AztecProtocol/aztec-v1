import gql from 'graphql-tag';

export default gql`
    type Asset {
        id: ID!
        balance: Int!
    }
    type Query {
        asset(id: ID!): Asset
    }
`;
