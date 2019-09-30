import gql from 'graphql-tag';

export default gql`
    query asset($id: String!, $domain: String! $currentAddress: String!) {
        asset(id: $id, domain: $domain, currentAddress: $currentAddress) {
            asset {
                balance
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
