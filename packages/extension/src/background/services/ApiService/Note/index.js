import query from '../utils/query';

export default async (request) => {
    const {
        data: {
            args: {
                id,
            },
        },
    } = request;

    const {
        note,
    } = await query(request, `
        note(id: "${id}") {
            note {
                noteHash
                value
                asset {
                    address
                    linkedTokenAddress
                }
                owner {
                    address
                }
                status
            }
            error {
                type
                key
                message
                response
            }
        }
    `);

    return note;
};
