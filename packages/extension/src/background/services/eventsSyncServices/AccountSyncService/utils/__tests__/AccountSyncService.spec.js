import AccountSyncService from '../../';
import Account from '~background/database/models/account';
import {
   START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';

jest.mock('~background/database/models/account');

const userEthAddress_1 = '0x12345678';

describe('LastSyncedBlock', () => {
   
   test('should call SyncManager.sync with default production block and inputed address', async () => {
      // given
      const syncMock = jest.spyOn(AccountSyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      Account.latest.mockResolvedValue(null);

      const inputs = {
         address: userEthAddress_1,
      }
      
      // action
      await AccountSyncService.syncEthAddress(inputs);

      // expectation
      const expectedResult = {
         address: userEthAddress_1,
         lastSyncedBlock: START_EVENTS_SYNCING_BLOCK,
      }

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

   test('should call SyncManager.sync with last sycned block and inputed address', async () => {
      // given
      const syncMock = jest.spyOn(AccountSyncService.manager, 'sync');
      syncMock.mockImplementation(() => {});

      const latestSyncedExtension = {
         address: '0x34gd',
         blockNumber: 499,
         linkedPublicKey: 'some key',
         registeredAt: 123,
      };
      account.latest.mockResolvedValue(latestSyncedExtension);

      const inputs = {
         address: userEthAddress_1,
      };
      
      // action
      await AccountSyncService.syncEthAddress(inputs);

      // expectation
      const expectedResult = {
         address: userEthAddress_1,
         lastSyncedBlock: latestSyncedExtension.blockNumber,
      };

      expect(syncMock).toHaveBeenCalledWith(expectedResult);
   });

});
