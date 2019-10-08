import {
    registrationData,
} from '~helpers/testUsers';
import AuthService from '~background/services/AuthService';


export default async function keystoreData(account) {
    const {
        address,
        linkedPublicKey,
        spendingPublicKey,
        blockNumber,
    } = account;

    await AuthService.registerExtension(registrationData);
    await AuthService.registerAddress({
        address,
        linkedPublicKey,
        spendingPublicKey,
        blockNumber,
    });

    const keyStore = await AuthService.getKeyStore();
    const session = await AuthService.getSession();

    return {
        keyStore,
        session,
    };
}
