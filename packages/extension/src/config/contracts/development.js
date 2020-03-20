import AccountRegistry from '~contracts/Behaviour20200305.json';
import AccountRegistryManager from '~contracts/IAccountRegistryManager.json';
import ACE from '~contracts/ACE.json';
import IERC20 from '~contracts/IERC20Mintable.json';
import IERC20Permit from '~contracts/IERC20Permit.json';
import IZkAsset from '~contracts/IZkAsset.json';

export default {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset: IZkAsset,
    ERC20: IERC20,
    IERC20Permit,
};
