import gql from 'graphql-tag';

export default gql`
  mutation approveAssetForDomain($asset: String!, $domain: String!) {
    approveAssetForDomain(asset: $asset, domain: $domain) {
        asset {
            id
        }
    }
  }
`;
