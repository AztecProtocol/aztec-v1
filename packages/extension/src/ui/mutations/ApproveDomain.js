import gql from 'graphql-tag';

export default gql`
  mutation registerDomain($domain: String! $currentAddress: String!) {
    registerDomain(domain: $domain, currentAddress: $currentAddress) {
        success
    }
  }
`;
