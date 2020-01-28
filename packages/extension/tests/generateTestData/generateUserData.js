/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import secp256k1 from '@aztec/secp256k1';
import {
    KeyStore,
    utils as keyvaultUtils,
} from '~/utils/keyvault';
import randomId from '../utils/randomId';
import prettyPrint from '../utils/prettyPrint';

const generateAccount = async () => {
    const password = randomId(10, 36);
    const salt = randomId(6, 36);
    const mnemonic = KeyStore.generateRandomSeed(randomId());

    const {
        pwDerivedKey,
    } = await KeyStore.generateDerivedKey({
        password,
        salt,
    });

    const keyStore = new KeyStore({
        pwDerivedKey,
        salt,
        mnemonic,
        hdPathString: "m/44'/60'/0'/0",
    });

    const {
        publicKey: linkedPublicKey,
        encPrivKey,
    } = keyStore.privacyKeys;
    const linkedPrivateKey = keyvaultUtils.decryptString(encPrivKey, pwDerivedKey);

    const privateKey = keyStore.exportPrivateKey(pwDerivedKey);
    const spendingKey = secp256k1.ec.keyFromPrivate(privateKey);
    const spendingPublicKey = `0x${spendingKey.getPublic(true, 'hex')}`;
    const address = secp256k1.ecdsa.accountFromPublicKey(spendingPublicKey);

    return {
        keyStore,
        pwDerivedKey,
        password,
        salt,
        mnemonic,
        userAccount: {
            address,
            linkedPublicKey,
            linkedPrivateKey,
            spendingPublicKey,
        },
    };
};

export default async function generateUserData(numberOfAccounts = 2) {
    console.log('Generating user accounts...');
    const accounts = [];
    for (let i = 0; i < numberOfAccounts; i += 1) {
        const account = await generateAccount(); // eslint-disable-line no-await-in-loop
        accounts.push(account);
    }

    const {
        keyStore,
        password,
        pwDerivedKey,
    } = accounts[0];

    const registrationData = {
        keyStore,
        pwDerivedKey,
    };

    const content = [
        ...accounts.map(({
            userAccount,
        }, i) => `export const userAccount${i ? i + 1 : ''} = ${prettyPrint(userAccount)};`),
        `export const registrationData = ${prettyPrint(registrationData)};`,
        `const pwDerivedKeyStr = '${JSON.stringify(pwDerivedKey)}';`,
        'export const pwDerivedKey = new Uint8Array(Object.values(JSON.parse(pwDerivedKeyStr)));',
        `export const password = '${password}';`,
    ].join('\n\n');

    const dest = path.resolve(__dirname, '../helpers/testUsers.js');
    try {
        fs.writeFileSync(dest, `${content.trim()}\n`);
        console.log(`Successfully generated ${numberOfAccounts} user accounts.`);
    } catch (error) {
        console.log('Failed to generate user accounts.', error);
    }

    return accounts[0];
}
