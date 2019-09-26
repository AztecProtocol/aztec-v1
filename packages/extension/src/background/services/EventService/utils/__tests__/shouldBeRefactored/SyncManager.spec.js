import SyncManager from '../../helpers/SyncManager';
import Web3Service from '~background/services/Web3Service';
import fetchAsset from '../fetchAssets';


jest.mock('~background/services/Web3Service');
jest.mock('../fetchAssets');

const networkId_1 = '2293';


describe('Sync Block Number', () => {
   
   it.skip('should call own syncAssets method with inputed start block and network id', async () => {
      // given
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;

      const syncAssetsMock = jest.spyOn(manager, 'syncAssets');
      syncAssetsMock.mockImplementation(() => {});

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

      expect(syncAssetsMock).toHaveBeenCalledWith(expectedResult);
   });

   it.skip('should save lastSyncedBlock into syncManager', async () => {
      // given
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;
      const currentBlock = 3453453;

      Web3Service.eth = {
         getBlockNumber: () => currentBlock
      };
      fetchAssets.mockResolvedValue([]);

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

   it.skip('should call "fetchAssets" with right: fromBlock, fromBlock, networkId', async () => {
      // given
      const manager = new SyncManager();
      const lastSyncedBlock = 4434;
      const currentBlock = 3453453;

      Web3Service.eth = {
         getBlockNumber: () => currentBlock
      };

      fetchAssets.mockImplementation(() => []);

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

      expect(fetchAssets).toHaveBeenCalledWith(expectedResult);
   });

});

