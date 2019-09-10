import EventService from '../../';
import Note from '~background/database/models/note';
import Account from '~background/database/models/account';
import Asset from '~background/database/models/asset';
import {
   NOTE_STATUS,
} from '~background/config/constants'
import * as fetchAccountModule from '../fetchAccount';
import * as fetchNotesModule from '../fetchNotes';
import {
   clearDB
} from '~background/database';


describe('LastSyncedBlock', () => {

   const account_1 = {
      address: '0x12345678',
      linkedPublicKey: '34563',
      blockNumber: 234,
   };
   
   const note_1 = {
      noteHash: '0x432',
      owner: account_1.address,
      metadata: '0x0',
      blockNumber: 344,
      status: NOTE_STATUS.CREATED,
   }
   
   it('should call NotesSyncManager.sync with account block number and inputed address', async () => {
      // given
      const syncMock = jest.spyOn(EventService.notesSyncManager, 'sync');
      syncMock.mockImplementation(() => {});

      const fetchAccountMock = jest.spyOn(EventService, 'fetchAztecAccount');
      fetchAccountMock.mockImplementation(() => ({
         error: null,
         account: account_1
      }));

      const noteLatestMock = jest.spyOn(Note, 'latest');
      noteLatestMock.mockResolvedValue(null);

      const inputs = {
         address: account_1.address,
      };
      
      // action
      await EventService.syncNotes(inputs);

      // expectation
      const expectedResult = {
         address: inputs.address,
         lastSyncedBlock: account_1.blockNumber,
      };

      expect(syncMock).toHaveBeenCalledWith(expectedResult);

      syncMock.mockRestore();
      noteLatestMock.mockRestore();
      noteLatestMock.mockRestore();
   });

   it('should call NotesSyncManager.sync with last synced Note number and inputed address', async () => {
      // given
      const syncMock = jest.spyOn(EventService.notesSyncManager, 'sync');
      syncMock.mockImplementation(() => {});

      const fetchAccountMock = jest.spyOn(EventService, 'fetchAztecAccount');
      fetchAccountMock.mockImplementation(() => ({
         error: null,
         account: account_1
      }));

      const noteLatestMock = jest.spyOn(Note, 'latest');
      noteLatestMock.mockResolvedValue(note_1);

      const inputs = {
         address: account_1.address,
      };
      
      // action
      await EventService.syncNotes(inputs);

      // expectation
      const expectedResult = {
         address: inputs.address,
         lastSyncedBlock: note_1.blockNumber,
      };

      expect(syncMock).toHaveBeenCalledWith(expectedResult);

      syncMock.mockRestore();
      noteLatestMock.mockRestore();
      noteLatestMock.mockRestore();
   });

});


describe('fetchAztecAccount', () => {

   const account_1 = {
      address: '0x12345678',
      linkedPublicKey: '34563',
      blockNumber: 234,
   };

   afterEach(async () => {
      clearDB();
   });

   it('should return latest account which stored in the db', async () => {
      // given
      const accountLatestMock = jest.spyOn(Account, 'latest');
      accountLatestMock.mockResolvedValue(account_1);

      // action
      const { error, account } = await EventService.fetchAztecAccount({
         address: account_1.address,
      });

      // expectation
      expect(error).toEqual(null);
      expect(account).toEqual(account_1);

      accountLatestMock.mockRestore();
   });

   it('should return latest account which stored in the db', async () => {
      // given
      const fetchAccountMock = jest.spyOn(fetchAccountModule, 'fetchAccount');
      fetchAccountMock.mockResolvedValue({
         error: null,
         account: account_1,
      });

      // action
      const { error, account } = await EventService.fetchAztecAccount({
         address: account_1.address,
      });

      // expectation
      expect(error).toBeNull();
      expect(account).toEqual(account_1);

      fetchAccountMock.mockRestore();
   });

});


describe('fetchLatestNote', () => {

   const account_1 = {
      address: '0x123445378',
      linkedPublicKey: '34563',
      blockNumber: 234,
   };

   const note_1 = {
      noteHash: '0x432',
      owner: account_1.address,
      metadata: '0x0',
      blockNumber: 344,
      status: NOTE_STATUS.CREATED,
      networkId: 1,
      asset: '0x34533',
   };

   const note_2 = {
      noteHash: '0x434',
      owner: account_1.address,
      metadata: '0x0',
      blockNumber: 344,
      status: NOTE_STATUS.CREATED,
      networkId: 1,
      asset: '0x34533',
   }

   const rawAssets = [
      {
          registryOwner: '0x21',
          registryAddress: '0x24',
          scalingFactor: 1,
          linkedTokenAddress: '0x25',
          canAdjustSupply: true,
          canConvert: false,
          blockNumber: 4,
      },
      {
          registryOwner: '0x02',
          registryAddress: '0x01',
          scalingFactor: 2,
          linkedTokenAddress: '0xff',
          canAdjustSupply: false,
          canConvert: true,
          blockNumber: 5,
      },
  ];

   afterEach(() => {
      clearDB();
   });

   it('should call fetchNotes with passed assetAddress', async () => {
      // given
      const isSyncedMocked = jest.spyOn(EventService.assetsSyncManager, 'isSynced');
      isSyncedMocked.mockResolvedValue(true);

      const fetchNotesMocked = jest.spyOn(fetchNotesModule, 'fetchNotes')
      fetchNotesMocked.mockImplementation(() => ({
         error: null,
         groupedNotes: {
            createNotes: [],
            updateNotes: [],
            destroyNotes: [],
            isEmpty: () => true,
         },
      }));

      await EventService.fetchLatestNote({
         noteHash: note_1.noteHash,
         assetAddress: note_1.asset,
         networkId: note_1.networkId,
      });

      // expected
      const expectedInputParams = {
         noteHash: note_1.noteHash,
         fromAssets: [note_1.asset],
         networkId: note_1.networkId,
      };

      expect(fetchNotesMocked).toHaveBeenCalledWith(expectedInputParams);
      isSyncedMocked.mockRestore();
      fetchNotesMocked.mockRestore();
   });

   it.only('should call fetchNotes with synced assets if assetAddress wasnt passes as input param', async () => {
      // given
      const isSyncedMocked = jest.spyOn(EventService.assetsSyncManager, 'isSynced');
      isSyncedMocked.mockResolvedValue(true);

      const fetchNotesMocked = jest.spyOn(fetchNotesModule, 'fetchNotes')
      fetchNotesMocked.mockImplementation(() => ({
         error: null,
         groupedNotes: {
            createNotes: [],
            updateNotes: [],
            destroyNotes: [],
            isEmpty: () => true,
         },
      }));

      await Asset.bulkAdd(rawAssets);

      await EventService.fetchLatestNote({
         noteHash: note_1.noteHash,
         networkId: note_1.networkId,
      });

      // expected
      const expectedInputParams = {
         noteHash: note_1.noteHash,
         fromAssets: rawAssets.map(({registryOwner}) => registryOwner),
         networkId: note_1.networkId,
      };

      expect(fetchNotesMocked).toHaveBeenCalledWith(expectedInputParams);
      isSyncedMocked.mockRestore();
      fetchNotesMocked.mockRestore();
   });

})