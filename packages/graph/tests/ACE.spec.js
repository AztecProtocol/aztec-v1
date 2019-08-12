/* eslint-disable import/no-unresolved */
import ACE from '../build/contracts/ACE';
import ERC20Mintable from '../build/contracts/ERC20Mintable';
import ZkAsset from '../build/contracts/ZkAsset';
/* eslint-enable */
import Web3Service from './helpers/Web3Service';
import Web3Events from './helpers/Web3Events';
import Query from './helpers/Query';

describe('ACE', () => {
    beforeAll(async () => {
        Web3Service.init();
        Web3Service.registerContract(ACE);
    });

    it('trigger CreateNoteRegistry event', async () => {
        const {
            address: erc20Address,
        } = await Web3Service.deploy(ERC20Mintable);
        const aceAddress = Web3Service.contract('ACE').address;
        const scalingFactor = 1;
        const transaction = await Web3Service.deploy(ZkAsset, [
            aceAddress,
            erc20Address,
            scalingFactor,
        ]);
        let {
            address: zkAssetAddress,
        } = transaction;
        zkAssetAddress = zkAssetAddress.toLowerCase();

        const pastEvents = await Web3Service
            .useContract('ACE')
            .events('CreateNoteRegistry')
            .where({
                id: zkAssetAddress,
            });

        Web3Events(pastEvents)
            .event('CreateNoteRegistry')
            .toHaveBeenCalledTimes(1)
            .toHaveBeenCalledWith({
                canAdjustSupply: false,
                canConvert: true,
                scalingFactor,
                linkedTokenAddress: erc20Address,
                registryOwner: zkAssetAddress,
            });

        const query = `
            asset(id:"${zkAssetAddress}") {
                id
            }
        `;
        const data = await Query({
            query,
        });

        expect(data).toEqual({
            asset: {
                id: zkAssetAddress,
            },
        });
    });
});
