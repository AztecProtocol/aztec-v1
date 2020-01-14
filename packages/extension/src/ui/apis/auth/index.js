import isLoggedIn from './isLoggedIn';
import getCurrentUser from './getCurrentUser';
import createPwDerivedKey from './createPwDerivedKey';
import createKeyStore from './createKeyStore';
import createSeedPhrase from './createSeedPhrase';
import backupSeedPhrase from './backupSeedPhrase';
import generateLinkedPublicKey from './generateLinkedPublicKey';
import registerExtension from './registerExtension';
import linkAccountToMetaMask from './linkAccountToMetaMask';
import sendRegisterAddress from './sendRegisterAddress';
import sendGSNRegisterTx from './sendGSNRegisterTx';
import registerAddress from './registerAddress';
import registerAccountOnChain from './registerAccountOnChain';
import restoreAccount from './restoreAccount';
import getAccountKeys from './getAccountKeys';
import approveDomain from './approveDomain';
import login from './login';
import getSession from './getSession';

export {
    isLoggedIn,
    getCurrentUser,
    createPwDerivedKey,
    createKeyStore,
    registerExtension,
    sendGSNRegisterTx,
    linkAccountToMetaMask,
    createSeedPhrase,
    backupSeedPhrase,
    generateLinkedPublicKey,
    sendRegisterAddress,
    registerAddress,
    registerAccountOnChain,
    restoreAccount,
    getAccountKeys,
    approveDomain,
    login,
    getSession,
};
