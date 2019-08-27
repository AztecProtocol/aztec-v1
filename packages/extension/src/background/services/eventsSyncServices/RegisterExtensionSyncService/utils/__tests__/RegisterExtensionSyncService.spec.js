import RegisterExtensionSyncService from '../../';
import registerExtension from '~background/database/models/registerExtension';
import {
   START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';

jest.mock('~background/database/models/registerExtension');

const userEthAddress_1 = '0x12345678';

describe('LastSyncedBlock', () => {
   
   test('should call SyncManager.sync with default production block and inputed address', async () => {
      const syncMock = jest.spyOn(RegisterExtensionSyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      registerExtension.latest.mockResolvedValue(null);

      const inputs = {
         address: userEthAddress_1,
      }
      
      await RegisterExtensionSyncService.syncEthAddress(inputs);

      const expectedResult = {
         address: userEthAddress_1,
         lastSyncedBlock: START_EVENTS_SYNCING_BLOCK,
      }

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

   test('should call SyncManager.sync with last sycned block and inputed address', async () => {
      const syncMock = jest.spyOn(RegisterExtensionSyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      const latestSyncedExtension = {
         address: '0x34gd',
         blockNumber: 499,
         linkedPublicKey: 'some key',
         registeredAt: 123,
      };
      registerExtension.latest.mockResolvedValue(latestSyncedExtension);

      const inputs = {
         address: userEthAddress_1,
      };
      
      await RegisterExtensionSyncService.syncEthAddress(inputs);

      const expectedResult = {
         address: userEthAddress_1,
         lastSyncedBlock: latestSyncedExtension.blockNumber,
      };

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

});
