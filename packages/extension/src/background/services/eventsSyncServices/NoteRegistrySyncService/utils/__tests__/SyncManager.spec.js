import SyncManager from '../../helpers/SyncManager'
import Web3Service from '~background/services/Web3Service'
import fetchCreateNoteRegistries from '../fetchCreateNoteRegistries'


jest.mock('~background/services/Web3Service');
jest.mock('../fetchCreateNoteRegistries');

const networkId_1 = '2293';


describe('Sync Block Number', () => {
   
   test('should call own syncCreateNoteRegistry method with inputed start block and network id', async () => {
      // given
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;

      const syncCreateNoteRegistryMock = jest.spyOn(manager, 'syncCreateNoteRegistry');
      syncCreateNoteRegistryMock.mockImplementation(() => {});

      const inputs = {
         networkId: networkId_1,
         lastSyncedBlock,
      };
      
      // action
      await manager.sync(inputs);

      // expectation
      const expectedResult = {
         networkId: networkId_1,
         lastSyncedBlock,
      };

      expect(syncCreateNoteRegistryMock).toHaveBeenCalledWith(expectedResult);
   });

   test('should save lastSyncedBlock into syncManager', async () => {
      // given
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
      
      // action
      await manager.sync(inputs);

      // expectation
      const expectedResult = {
         lastSyncedBlock: currentBlock,
      };

      const stateForNetwork = manager.networks.get(inputs.networkId);
      expect(stateForNetwork.lastSyncedBlock).toEqual(expectedResult.lastSyncedBlock);
   });

   test('should call "fetchCreateNoteRegistries" with right: fromBlock, fromBlock, networkId', async () => {
      // given
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;
      const currentBlock = 3453453;

      Web3Service.eth = {
         getBlockNumber: () => currentBlock
      };

      fetchCreateNoteRegistries.mockImplementation(() => []);

      const inputs = {
         networkId: networkId_1,
         lastSyncedBlock: lastSyncedBlock,
      };
      
      // action
      await manager.sync(inputs);

      // expectation
      const expectedResult = {
         networkId: inputs.networkId,
         fromBlock: inputs.lastSyncedBlock + 1,
         toBlock: currentBlock,
         onError: manager.handleFetchError,
      };

      expect(fetchCreateNoteRegistries).toHaveBeenCalledWith(expectedResult);
   });

});

