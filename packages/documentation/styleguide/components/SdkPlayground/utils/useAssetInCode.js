export default function useAssetInCode(code, zkAssetAddress) {
  return code
    .replace(/zkAssetAddress = '(0x)?[0-9a-f]{0,}'/ig, `zkAssetAddress = '${zkAssetAddress}'`);
}
