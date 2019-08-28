import SyncManager from '../../helpers/SyncManager'
import Web3Service from '~background/services/Web3Service'
import fetchCreateNoteRegistries from '../fetchCreateNoteRegistries'


jest.mock('~background/services/Web3Service');
jest.mock('../fetchCreateNoteRegistries');

const networkId_1 = '2293';


describe('Sync Block Number', () => {
   
   test('should call own syncCreateNoteRegistry method with inputed start block and network id', async () => {
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;

      const syncCreateNoteRegistryMock = jest.spyOn(manager, 'syncCreateNoteRegistry');
      syncCreateNoteRegistryMock.mockImplementation(() => {});

      const inputs = {
         networkId: networkId_1,
         lastSyncedBlock,
      };
      
      await manager.sync(inputs);

      const expectedResult = {
         networkId: networkId_1,
         lastSyncedBlock,
      };

      expect(syncCreateNoteRegistryMock).toHaveBeenCalledWith(expectedResult);
   });

   test('should save lastSyncedBlock into syncManager', async () => {
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;
      const currentBlock = 3453453;

      Web3Service.eth = {
         getBlockNumber: () => currentBlock
      };
      fetchCreateNoteRegistries.mockResolvedValue([]);

      const inputs = {
         networkId: networkId_1,
         lastSyncedBlock: lastSyncedBlock,
      };
      
      await manager.sync(inputs);

      const expectedResult = {
         lastSyncedBlock: currentBlock,
      };

      const stateForNetwork = manager.networks.get(inputs.networkId);
      expect(stateForNetwork.lastSyncedBlock).toEqual(expectedResult.lastSyncedBlock);
   });

});

