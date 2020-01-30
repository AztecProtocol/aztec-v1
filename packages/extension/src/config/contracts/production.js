import AccountRegistry from '~contracts/Behaviour20200106.json';
import AccountRegistryManager from '~contracts/AccountRegistryManager.json';
import IAZTEC from '~contracts/IAZTEC.json';
import IERC20 from '~contracts/IERC20Mintable.json';
import IZkAsset from '~contracts/IZkAsset.json';

export default {
    AccountRegistry,
    AccountRegistryManager,
    ACE: IAZTEC,
    ZkAsset: IZkAsset,
    ERC20: IERC20,
};
