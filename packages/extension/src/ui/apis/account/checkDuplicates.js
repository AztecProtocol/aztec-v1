import createKeyStore from '~ui/apis/auth/createKeyStore';
import createPwDerivedKey from '~ui/apis/auth/createPwDerivedKey';
import getExtensionAccount from './getExtensionAccount';

export default async function checkDuplicates({
    address,
    seedPhrase,
    password,
}) {
    const {
        linkedPublicKey: onChainLinkedPublicKey,
    } = await getExtensionAccount(address) || {};

    const {
        pwDerivedKey,
    } = await createPwDerivedKey({
        password,
    });
    const {
        linkedPublicKey,
    } = await createKeyStore({
        pwDerivedKey,
        seedPhrase,
    });

    return {
        linkedPublicKey,
        onChainLinkedPublicKey,
        duplicated: !!onChainLinkedPublicKey
            && onChainLinkedPublicKey !== linkedPublicKey,
    };
}
