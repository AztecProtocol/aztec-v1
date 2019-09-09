import AssetsSyncService from '../../';
import Asset from '~background/database/models/asset';
import {
   START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';

jest.mock('~background/database/models/asset');

const networkId_1 = '2293';

describe('LastSyncedBlock', () => {
   
   test('should call SyncManager.sync with default production block and inputed address', async () => {
      // given
      const syncMock = jest.spyOn(AssetsSyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      Asset.latest.mockResolvedValue(null);

      const inputs = {
         networkId: networkId_1,
      }

      // action
      await AssetsSyncService.syncCreateNoteRegistries(inputs);

      // expectation
      const expectedResult = {
         networkId: networkId_1,
         lastSyncedBlock: START_EVENTS_SYNCING_BLOCK,
      }

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

   test('should call SyncManager.sync with last sycned block and inputed address', async () => {
      // given
      const syncMock = jest.spyOn(AssetsSyncService.manager, 'sync');
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
      Asset.latest.mockResolvedValue(latestSyncedExtension);

      const inputs = {
         networkId: networkId_1,
      };
      
      // action
      await AssetsSyncService.syncCreateNoteRegistries(inputs);

      // expectation
      const expectedResult = {
         networkId: networkId_1,
         lastSyncedBlock: latestSyncedExtension.blockNumber,
      };

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

});