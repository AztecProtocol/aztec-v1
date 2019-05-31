import {
  CreateNoteRegistry,
} from '../types/ACE/ACE';
import {
  ZkAsset as ZkAssetTemplate,
} from '../types/ACE/templates';
import {
  ZkAsset,
} from '../types/schema';

export function createNoteRegistry(event: CreateNoteRegistry): void {
  let zkAssetAddress = event.params.zkAssetAddress;
  ZkAssetTemplate.create(zkAssetAddress);

  let id = zkAssetAddress.toHex();
  let zkAsset = new ZkAsset(id);
  zkAsset.address = zkAssetAddress;
  zkAsset.linkedTokenAddress = event.params.linkedTokenAddress;
  zkAsset.scalingFactor = event.params.scalingFactor;
  zkAsset.canAdjustSupply = event.params.canAdjustSupply;
  zkAsset.canConvert = event.params.canConvert;
  zkAsset.save();
}
