import gql from 'graphql-tag';

export default function notesQuery(requestedFields) {
    return gql`
        query notesQuery(
            $where: Note_filter!
        ) {
            notes(
                where: $where
            ) {
                notes {
                    ${requestedFields}
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
}
