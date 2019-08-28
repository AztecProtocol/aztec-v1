import NoteRegistrySyncService from '../../';
import createNoteRegistry from '~background/database/models/createNoteRegistry';
import {
   START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';

jest.mock('~background/database/models/createNoteRegistry');

const networkId_1 = '2293';

describe('LastSyncedBlock', () => {
   
   test('should call SyncManager.sync with default production block and inputed address', async () => {
      const syncMock = jest.spyOn(NoteRegistrySyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      createNoteRegistry.latest.mockResolvedValue(null);

      const inputs = {
         networkId: networkId_1,
      }
      
      await NoteRegistrySyncService.syncCreateNoteRegistries(inputs);

      const expectedResult = {
         networkId: networkId_1,
         lastSyncedBlock: START_EVENTS_SYNCING_BLOCK,
      }

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

   test('should call SyncManager.sync with last sycned block and inputed address', async () => {
      const syncMock = jest.spyOn(NoteRegistrySyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      const latestSyncedExtension = {
         registryOwner: '0x34gd',
         blockNumber: 439,
         registryAddress: '0x34ge',
         scalingFactor: 0.3,
         linkedTokenAddress: '0xf33',
         canAdjustSupply: false,
         canConvert: false,
      };
      createNoteRegistry.latest.mockResolvedValue(latestSyncedExtension);

      const inputs = {
         networkId: networkId_1,
      };
      
      await NoteRegistrySyncService.syncCreateNoteRegistries(inputs);

      const expectedResult = {
         networkId: networkId_1,
         lastSyncedBlock: latestSyncedExtension.blockNumber,
      };

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

});