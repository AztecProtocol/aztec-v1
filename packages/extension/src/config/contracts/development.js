import AccountRegistry from '~contracts/IAccountRegistryBehaviour.json';
import AccountRegistryManager from '~contracts/IAccountRegistryManager.json';
import ACE from '~contracts/ACE.json';
import IERC20 from '~contracts/IERC20Mintable.json';
import IZkAsset from '~contracts/IZkAsset.json';

export default {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset: IZkAsset,
    ERC20: IERC20,
};
