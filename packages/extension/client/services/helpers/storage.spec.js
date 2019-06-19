import sinon from 'sinon';
import { assert } from 'chai';

// local dependencies

import chrome from 'sinon-chrome';
import storage from './storage.js';


describe('storage.js',  async () => {


    beforeEach(function () {
        global.chrome = chrome;
        chrome.storage.local.set.callsArg(1);
        chrome.storage.local.get.callsArgWith(1, {foo: 'bar'});

    });

    it('should save the passed in data in msg.pack format', async () => {
        const savedData = await storage.set({ foo: "bar"});
        assert.deepEqual(savedData, { foo: "bar" });
        assert.ok(chrome.storage.local.set.called, 'chrome storage should be called');
    });

    it('should fetch the key the passed in and decode it from msg.pack', async () => {
        const savedData = await storage.get(['foo']);
        assert.deepEqual(savedData, { foo: "bar" });
        assert.ok(chrome.storage.local.get.called, 'chrome storage should be called');
    });

    afterEach(function () {
        chrome.flush();
    });
});

