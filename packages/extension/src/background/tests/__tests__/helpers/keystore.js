import {
    userAccount,
    registrationData,
} from '~helpers/testUsers';
import AuthService from '~background/services/AuthService';


export default async function keystoreData() {
    const {
        address,
        linkedPublicKey,
        spendingPublicKey,
        blockNumber,
    } = account;

    

    return {
        keyStore,
        session,
        userAccount,
    };
}
