import createKeyStore from '~/ui/apis/auth/createKeyStore';
import createPwDerivedKey from '~/ui/apis/auth/createPwDerivedKey';

export default async function generateLinkedPublicKey({
    seedPhrase,
}) {
    let linkedPublicKey;

    // we just need a random password to get the linkedPublicKey from seedPhrase
    // we won't use this password to create account
    const mockPassword = '';

    try {
        const {
            pwDerivedKey,
        } = await createPwDerivedKey({
            password: mockPassword,
        });
        ({
            linkedPublicKey,
        } = await createKeyStore({
            pwDerivedKey,
            seedPhrase,
        }));
    } catch (error) {
        linkedPublicKey = '';
    }

    return {
        linkedPublicKey,
    };
}
