import query from '../utils/query';

export default async function account() {
    const {
        accountResponse,
    } = await query(`
        accountResponse: account() {
            account {
                linkedPublicKey
                address
            }
            error {
                type
                key
                message
                response
            }
        }
    `) || {};
    return accountResponse;
};