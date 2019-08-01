import gql from 'graphql-tag';

export default gql`
  mutation login($password: String!, $domain: String! $address: String!) {
    login(password:$password, domain: $domain, address: $address) {
        id
    }
  }
`;
