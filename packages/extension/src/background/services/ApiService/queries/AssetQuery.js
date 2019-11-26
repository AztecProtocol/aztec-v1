import gql from 'graphql-tag';

export default gql`
    query asset($id: String!, $domain: String! $currentAddress: String!) {
        asset(id: $id, domain: $domain, currentAddress: $currentAddress) {
            asset {
                address
                linkedTokenAddress
                scalingFactor
                canAdjustSupply
                canConvert
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
