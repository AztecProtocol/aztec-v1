import AccountRegistry from '~contracts/Behaviour20200207.json';
import AccountRegistryManager from '~contracts/AccountRegistryManager.json';
import ACE from '~contracts/IACE.json';
import IERC20 from '~contracts/IERC20Mintable.json';
import IZkAsset from '~contracts/IZkAsset.json';

export default {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset: IZkAsset,
    ERC20: IERC20,
};
