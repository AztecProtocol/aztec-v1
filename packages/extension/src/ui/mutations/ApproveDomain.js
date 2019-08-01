import gql from 'graphql-tag';

export default gql`
  mutation approveAssetForDomain($asset: String!, $domain: String! $address: String!) {
    approveAssetForDomain(asset: $asset, domain: $domain, currentAddress: $address) {
        asset {
            id
        }
    }
  }
`;
