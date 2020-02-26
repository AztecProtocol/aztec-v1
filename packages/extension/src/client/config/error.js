export default {
    ace: {
        publicApprove: 'Failed to send ACE.publicApprove',
        validateProof: 'Failed to validate proof',
        getRegistry: 'Cannot get registry info for asset %{asset}',
    },
    erc20: {
        balanceOf: "Cannot get balance of linked token for account '%{account}'.",
        allowance: "Cannot get allowance of linked token for account '%{account}'.",
        totalSupply: 'Failed to get total supply of linked token.',
    },
    zkAsset: {
        confidentialTransfer: 'Failed to send zkAsset.confidentialTransfer',
        updateNoteMetaData: "Failed to update note's metadata.",
        confidentialApprove: 'Failed to send zkAsset.confidentialApprove',
        confidentialTransferFrom: 'Failed to send zkAsset.confidentialTransferFrom',
        confidentialMint: 'Failed to send zkAsset.confidentialMint',
        confidentialBurn: 'Failed to send zkAsset.confidentialBurn',
        private: "Cannot call '%{fn}' on private asset.",
    },
    note: {
        fromViewingKey: 'Failed to recover note from its viewing key.',
        shareAccess: 'Failed to shared note access.',
        pick: {
            empty: 'Failed to pick notes from balance.',
        },
    },
    account: {
        not: {
            registered: 'The user has not setup the AZTEC extension.',
            linked: 'Address has no linked AZTEC extension account.',
        },
    },
    user: {
        unregistered: "Cannot call '%{fn}' on unregistered user.",
        logout: "'%{fn}' can only be called on current logged in account.",
    },
    input: {
        contract: {
            address: {
                empty: {
                    _: 'Please provide valid addresses for contracts %{contractName}',
                    1: 'Please provide an address for contract %{contractName}',
                },
            },
        },
        address: {
            not: {
                valid: 'Input address not valid.',
            },
        },
        amount: {
            not: {
                match: {
                    transaction: 'Input amount does not match total transactions.',
                },
            },
        },
        note: {
            not: {
                defined: 'Input note cannot be empty.',
                valid: 'Input note is not a valid AZTEC note.',
                eq: 'Target note value should be equal to its comparison note value.',
                gt: 'Target note value should be greater than its comparison note value.',
                gte: 'Target note value should be greater than or equal to its comparison note value.',
            },
        },
        utilityNote: {
            wrong: {
                type: 'Utility note is not a valid AZTEC note',
                value: 'Utility note has incorrect value.',
            },
        },
    },
    api: {
        mint: {
            notValid: "Cannot call mint on an asset that doesn't allow to adjust total supply.",
            totalMinted: {
                not: {
                    found: 'Cannot find previous balance note.',
                    valid: 'Cannot recover previous balance note.',
                },
            },
        },
        burn: {
            notValid: 'Cannot call burn on an asset that is not ZkAssetBurnable.',
            totalBurned: {
                not: {
                    found: 'Cannot find previous balance note.',
                    valid: 'Cannot recover previous balance note.',
                },
            },
        },
    },
};
