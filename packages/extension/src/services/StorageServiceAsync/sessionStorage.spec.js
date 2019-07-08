import sinon from 'sinon';
import { assert } from 'chai';

// local dependencies

import chrome from 'sinon-chrome';
import sessionStorage from './sessionStorage.js';
import * as storage from '~utils/storage';

import fixtures from '../../utils/keyvault/keystore.json';

const keyStore = {
    encSeed: {
        encStr: 'd1B83kKme6QjbMFOX5sbOjVRM1W30UQab+fFyzRBZXdVOnJn1F0RZQdlbc9I2xpMynE3CgwwnMtzCss78g0yy7IH3WCs7qWKUqeGyeMHmSfBg4KFdVKIBP4FxGPB7eytLrPWeZIp9jsNHoQs0X0hEaZKEvfJ7ZM/fVJwKokl6RGhf3Ag6dTDIQ==', nonce: 'ihbLmwWkzRREZtYh7n8ieOn8BmS/LEjH',
    },
    encHdRootPriv: {
        encStr: 'yUFFECKGLbNvgrEOVYUP4SAqzI7tNbPyjRULMmsKj/d6SsAzQoTV13RecOFEaGmR63Ziz4kpOG9Xm0+aJEGClWzmmsVPc45qRZdjpWTPGllEBVupwBE3pO+XB6XiqCN3HaDIkPnztbiVej6uHICvKWX40UBBL3oFVJJlIB3Tmw==',
        nonce: 'bWih8Wqgo2PC1XvyO1A41/Q54WMokoBV',
    },
    hdPathString: "m/0'/0'/0'",
    salt: 'strangeSalt',
    hdIndex: 1,
    privacyKeys: {
        publicKey: 'z7kvlspK+/9b/7+zzJwIJ3qjd76LFBZVDWmUxlD6QU0=',
        encPrivKey: {
            encStr: 'PwQcvptXh/QnVHQJ1ybByOIlmaz0IYMcfeC7/c+P43Ruy03W9m9gwo4lAiH4NZknG1cWwNydKOAi/h4O2y+RD6RmYW9x55CAXtsfdm3xTsQ=',
            nonce: 'UtfzJajIJRYc8LnqcCB4qFFM52lXh6Q6',
        },
    },
};

jest.mock('~utils/storage');


describe.only('sessionStorage.js', () => {
    let set;
    beforeEach(() => {
        global.chrome = chrome;
        set = sinon.spy(storage, 'set');

        // overide storage functions to test properly here
    });
    afterEach(() => {
        set.restore();
        // overide storage functions to test properly here
    });

    it('should return the pwDerrivedKey if the session is less than 7 days old and the host was active in the last 2 days', async () => {
        // storage.set({
        //     's:chrome://extension/aztecId': {
        //         createdAt: Date.now(),
        //     },
        // });
        // storage.get.onCall(1).resolves({
        //     pwDerivedKey: fixtures.valid[0].pwDerivedKey,
        // keyStore: { encSeed: {
        //         encStr: 'd1B83kKme6QjbMFOX5sbOjVRM1W30UQab+fFyzRBZXdVOnJn1F0RZQdlbc9I2xpMynE3CgwwnMtzCss78g0yy7IH3WCs7qWKUqeGyeMHmSfBg4KFdVKIBP4FxGPB7eytLrPWeZIp9jsNHoQs0X0hEaZKEvfJ7ZM/fVJwKokl6RGhf3Ag6dTDIQ==',
        //         nonce: 'ihbLmwWkzRREZtYh7n8ieOn8BmS/LEjH',
        //     },
        //     encHdRootPriv: {
        //         encStr: 'yUFFECKGLbNvgrEOVYUP4SAqzI7tNbPyjRULMmsKj/d6SsAzQoTV13RecOFEaGmR63Ziz4kpOG9Xm0+aJEGClWzmmsVPc45qRZdjpWTPGllEBVupwBE3pO+XB6XiqCN3HaDIkPnztbiVej6uHICvKWX40UBBL3oFVJJlIB3Tmw==',
        //         nonce: 'bWih8Wqgo2PC1XvyO1A41/Q54WMokoBV',
        //     },
        //     hdPathString: "m/0'/0'/0'",
        //     salt: 'strangeSalt',
        //     hdIndex: 1,
        //     privacyKeys: {
        //         publicKey: 'z7kvlspK+/9b/7+zzJwIJ3qjd76LFBZVDWmUxlD6QU0=',
        //         encPrivKey: {
        //             encStr: 'PwQcvptXh/QnVHQJ1ybByOIlmaz0IYMcfeC7/c+P43Ruy03W9m9gwo4lAiH4NZknG1cWwNydKOAi/h4O2y+RD6RmYW9x55CAXtsfdm3xTsQ=',
        //             nonce: 'UtfzJajIJRYc8LnqcCB4qFFM52lXh6Q6',
        //         },
        //     },
        // },
        // });
        // storage.set.onCall(0).resolves({});
        // const session = await sessionStorage.checkSession('chrome://extension/aztecId');
        // assert.ok(session.pwDerivedKey, 'pwDerrivedKey should exist');
        // assert.ok(session.KeyStore, 'pwDerrivedKey should exist');
        // assert.ok(session.session, 'pwDerrivedKey should exist');
    });

    it('should return a valid session but not the pwDerrivedKey if the session is less than 7 days old but the host is not active', async () => {

    });

    it('logout should clear all active sessions', async () => {

    });


    it.only('login should generate the pwDerrivedKey and store it and create the root active session', async () => {
        sinon.stub(Date, 'now');
        Date.now.returns(0);
        await storage.set({
            keyStore,
        });
        await sessionStorage.login(fixtures.valid[0].password);

        const setKeys = await storage.get(['pwDerivedKey', 'session']);

        expect(setKeys).toEqual({
            pwDerivedKey: new Uint8Array(

                fixtures.valid[0].pwDerivedKey,
            ),
            session: {
                createdAt: 0,
                lastUpdated: 0,
                loginCount: 1,
            },
        });
    });

    it('create session should create a session for the host', async () => {
        await sessionStorage.createSession('chrome://extension/aztecId');
        // ex
    });


    afterEach(() => {
        chrome.flush();
    });
});
