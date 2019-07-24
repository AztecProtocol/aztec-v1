import gql from 'graphql-tag';

export default gql`
  mutation login($password: String!, $salt: String!, $domain: String!) {
    login(password:$password, salt: $salt, domain: $domain) {
        account    
    }
  }
`;
