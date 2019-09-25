import gql from 'graphql-tag';

export default gql`
  query accounts($addressArrStr: String!, $domain: String! $currentAddress: String!) {
    accounts(where: { address_in: [$addressArrStr] }, domain: $domain, currentAddress: $currentAddress) {
        accounts {
            address
            linkedPublicKey
        }
        error {
            type
            key
            message
            response
        }
    }
  }
`;
