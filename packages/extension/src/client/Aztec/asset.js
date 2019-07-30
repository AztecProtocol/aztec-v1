import Web3Service from '~client/services/Web3Service';
import query from '~client/utils/query';
import ContractError from '~client/utils/ContractError';
import proofFactory from '~client/apis/proofFactory';
import deposit from '~client/apis/deposit/prove';
import createNoteFromBalance from '~client/apis/createNoteFromBalance/prove';

const dataProperties = [
    'address',
    'linkedTokenAddress',
    'balance',
];

export default class Asset {
    constructor({
        id,
    } = {}) {
        this.id = id;
    }

    isValid() {
        return !!this.address;
    }

    refresh = async () => {
        const {
            assetResponse,
        } = await query(`
            assetResponse: asset(id: "${this.id}") {
                asset {
                    address
                    linkedTokenAddress
                    balance
                }
                error {
                    type
                    key
                    message
                    response
                }
            }
        `) || {};

        const {
            asset,
        } = assetResponse || {};
        if (asset) {
            dataProperties.forEach((key) => {
                this[key] = asset[key];
            });
        }
    };

    balanceOfLinkedToken = async (account) => {
        let balance = 0;
        let accountAddress = account;
        if (!accountAddress) {
            ({
                user: {
                    account: {
                        address: accountAddress,
                    },
                },
            } = await query(`
                user {
                    account {
                        address
                    }
                    error {
                        type
                        key
                        message
                        response
                    }
                }
            `));
        }

        try {
            balance = await Web3Service
                .useContract('ERC20')
                .at(this.linkedTokenAddress)
                .method('balanceOf')
                .call(accountAddress);
        } catch (error) {
            throw new ContractError('erc20.balanceOf', {
                messageOptions: {
                    account: accountAddress,
                },
            });
        }

        return balance;
    };

    /**
     *
     * Deposit
     *
     * - amount (Int! or [Int!])
     * - options
     *       from (Address)
     *       sender (Address)
     *       numberOfOutputNotes (Int): number of new notes; if input amount is an array, this value will be ignored.
     *
     * @returns ([Notes!])
     */
    deposit = async (amount, {
        from = '',
        sender = '',
        numberOfOutputNotes = 2,
    } = {}) => proofFactory(
        'deposit',
        deposit,
        {
            assetAddress: this.address,
            amount,
            from,
            sender,
            numberOfOutputNotes,
        },
    );

    createNoteFromBalance = async ({
        amount,
        sender = '',
        userAccess = [],
        numberOfInputNotes = 0,
    }) => proofFactory(
        'createNoteFromBalance',
        createNoteFromBalance,
        {
            assetAddress: this.address,
            amount,
            sender,
            userAccess,
            numberOfInputNotes,
        },
    );
}

export const assetFactory = async (assetId) => {
    const asset = new Asset({
        id: assetId,
    });
    await asset.refresh();

    return asset;
};
