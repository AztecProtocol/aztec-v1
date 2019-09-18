import gql from 'graphql-tag';

export default gql`
  mutation registerDomain($domain: String! $address: String!) {
    registerDomain(domain: $domain, currentAddress: $address) {
        success
    }
  }
`;
