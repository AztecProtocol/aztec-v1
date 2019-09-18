import { handleQuery } from '../../../utils/connectionUtils';

export default async function validateUserPermission(data) {
    const { response } = await handleQuery({
        ...data,
        query: `userPermission {
                    account { 
                        linkedPublicKey
                        registeredAt
                        address
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
