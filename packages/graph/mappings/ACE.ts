import { CreateNoteRegistry } from '../types/ACE/ACE';
import { ZkAsset as ZkAssetTemplate } from '../types/ACE/templates';
import { Asset } from '../types/schema';

export function createNoteRegistry(event: CreateNoteRegistry): void {
    let zkAssetAddress = event.params.registryOwner;
    ZkAssetTemplate.create(zkAssetAddress);

    let id = zkAssetAddress.toHex();
    let asset = new Asset(id);
    asset.address = zkAssetAddress;
    asset.linkedTokenAddress = event.params.linkedTokenAddress;
    asset.scalingFactor = event.params.scalingFactor;
    asset.canAdjustSupply = event.params.canAdjustSupply;
    asset.canConvert = event.params.canConvert;
    asset.save();
}
