import EventService from '../../';
import Note from '~background/database/models/note';
import Account from '~background/database/models/account';
import {
   NOTE_STATUS,
} from '~background/config/constants'
import * as fetchAccountModule from '../fetchAccount';
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