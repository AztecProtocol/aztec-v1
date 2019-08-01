export default {
    ace: {
        publicApprove: 'Failed to send ACE.publicApprove',
        validateProof: 'Failed to validate proof',
        getRegistry: 'Cannot get registry info for asset %{asset}',
    },
    erc20: {
        balanceOf: "Cannot get balance of linked token for account '%{account}'.",
        totalSupply: 'Failed to get total supply of linked token.',
    },
    zkAsset: {
        confidentialTransfer: 'Failed to send zkAsset.confidentialTransfer',
        updateNoteMetaData: "Failed to update note's metadata.",
        confidentialApprove: 'Failed to send zkAsset.confidentialApprove',
        confidentialTransferFrom: 'Failed to send zkAsset.confidentialTransferFrom',
        confidentialMint: 'Failed to send zkAsset.confidentialMint',
    },
    note: {
        fromViewingKey: 'Failed to recover note from its viewing key.',
        shareAccess: 'Failed to shared note access.',
    },
    account: {
        not: {
            linked: 'Address has no linked AZTEC extension account.',
        },
    },
    input: {
        address: {
            not: {
                valid: 'Input address not valid.',
            },
        },
    },
    api: {
        mint: {
            notValid: "Cannot call mint on an asset that doesn't allow to adjust total supply.",
        },
    },
};
