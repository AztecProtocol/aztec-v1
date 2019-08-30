import { handleQuery } from '../../../utils/connectionUtils';

export default async function validateUserPermission(data) {
    const { response } = await handleQuery({
        ...data,
        query: `userPermission {
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
            `,
    }) || {};
    return response;
}
