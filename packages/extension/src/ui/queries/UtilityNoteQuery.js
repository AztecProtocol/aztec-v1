import gql from 'graphql-tag';

export default gql`
    query utilityNote($id: String!) {
        utilityNote(id: $id) {
            note {
                decryptedViewingKey
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
