import sinon from 'sinon';
import chrome from 'sinon-chrome';
import { assert } from 'chai';

// local dependencies
import storage from '../helpers/storage';

import SyncService from ".";

describe('SyncService', function () {

    beforeEach(function () {
        global.chrome = chrome;
        sinon.stub(storage);
    });

    it('create note should save a note object to storage', async () =>{
        storage.get.resolves({
            'noteCount': 1,
            'assetCount': 0,
            'a:1:v:50': [],
        });

        await SyncService.createNote({
            value: 1000,
            owner: '0xe4A5Cb99EeC7a3aE8512e40A36eEa41bc1e91A1A',
            asset: 'asset1',
            noteHash: 'note1',
        });
        // it should store the note data
        assert(storage.get.calledWith(['asset1']));
        assert(storage.get.calledWith(['assetCount']));
        assert(storage.get.calledWith(['noteCount', 'a:1:v:50']));
        // it should store the note value in the index
        // notes ids are n:id
        // it should increment the id counter
        assert(storage.set.calledWith({
            'a:1:v:50': [ 2 ],
            'assetCount': 1,
            'n:2': 'note1',
            'asset1': 'a:1',
            'note1':{
                value: 1000,
                owner: '0xe4A5Cb99EeC7a3aE8512e40A36eEa41bc1e91A1A',
                asset: 1,
                id: 2,
            },
            noteCount: 2,
        }));
    });

    it('destroy note should update a notes status and remove from index', async() => {

        storage.get.onCall(0).resolves({
            note1: {
                id: 2,
                asset: 1,
                value: 1000,
            },
        });
        storage.get.onCall(1).resolves({
            'a:1:v:50': [2],
        });

        await SyncService.destroyNote('note1');
        assert.ok(storage.set.called, 'set should be called');
        assert(storage.set.calledWith({
            'a:1:v:50': [],
        }));

    });

    it('should not allow a transaction to go through if the db is locked', async() => {
        // don't resolve this
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        storage.get.resolves({
            'noteCount': 1,
            'assetCount': 0,
            'a:1:v:50': [],
        });
        const firstPromise = SyncService.atomicTransaction('createNote', {
            value: 1000,
            owner: '0xe4A5Cb99EeC7a3aE8512e40A36eEa41bc1e91A1A',
            asset: 'asset1',
            noteHash: 'note1',
        }).then(spy1);
        // this will keep resolving until the first call has resolved even though this is called before the promise
        // resolves
        await SyncService.atomicTransaction('createNote',{
            value: 1010,
            owner: '0xe4A5Cb99EeC7a3aE8512e40A36eEa41bc1e91A1A',
            asset: 'asset1',
            noteHash: 'note2',
        }).then(spy2);

        await firstPromise;
        assert.ok(spy1.calledBefore(spy2), 'spy1 should be called before spy2');

    });

    afterEach(function () {
        storage.get.restore();
        storage.set.restore();
    });
});

