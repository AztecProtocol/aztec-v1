import query from '../utils/query';

export default async function validateUserPermission() {
    const {
        userPermission,
    } = await query(`
        userPermission {
            account {
                linkedPublicKey
                address
                registeredAt
            }
            error {
                type
                key
                message
                response
            }
        }
    `) || {};

    return userPermission;
}
