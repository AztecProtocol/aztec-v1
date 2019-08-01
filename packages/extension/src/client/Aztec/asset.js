import address from '~utils/address';
import Web3Service from '~client/services/Web3Service';
import query from '~client/utils/query';
import ContractError from '~client/utils/ContractError';
import ApiError from '~client/utils/ApiError';
import proofFactory from '~client/apis/proofFactory';
import deposit from '~client/apis/deposit/prove';
import withdraw from '~client/apis/withdraw/prove';
import send from '~client/apis/send/prove';
import mint from '~client/apis/mint/prove';
import createNoteFromBalance from '~client/apis/createNoteFromBalance/prove';

const dataProperties = [
    'address',
    'linkedTokenAddress',
    'scalingFactor',
    'canAdjustSupply',
    'canConvert',
];

export default class Asset {
    constructor({
        id,
    } = {}) {
        this.id = address(id);
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
                    scalingFactor
                    canAdjustSupply
                    canConvert
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

    async balance() {
        const {
            assetResponse,
        } = await query(`
            assetResponse: asset(id: "${this.id}") {
                asset {
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

        return (asset && asset.balance) || 0;
    }

    async totalSupplyOfLinkedToken() {
        let totalSupply;
        try {
            totalSupply = await Web3Service
                .useContract('ERC20')
                .at(this.linkedTokenAddress)
                .method('totalSupply')
                .call();
        } catch (error) {
            throw new ContractError('erc20.totalSupply');
        }

        return totalSupply;
    }

    balanceOfLinkedToken = async (account) => {
        let balance = 0;
        let accountAddress = account;
        if (!accountAddress) {
            ({
                address: accountAddress,
            } = Web3Service.account);
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
     *       from (Address):            The address that will be funding the deposit of ERC20 tokens.
     *                                  This address needs to approve on the linked ERC20 token.
     *       sender (Address):          The proof sender.
     *       numberOfOutputNotes (Int): Number of new notes.
     *                                  If input amount is an array, this value will be ignored.
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

    withdraw = async (amount, {
        sender = '',
        numberOfInputNotes,
    } = {}) => proofFactory(
        'withdraw',
        withdraw,
        {
            assetAddress: this.address,
            amount,
            sender,
            numberOfInputNotes,
        },
    );

    /**
     *
     * Send
     *
     * - transaction (Transaction or [Transaction])   Transaction = { amount, to, numberOfOutputNotes }
     * - options
     *       sender (Address):          The proof sender.
     *       numberOfInputNotes (Int):  Number of notes picked from esisting pool.
     *                                  Will use extension's or user's setting if undefined.
     *       numberOfOutputNotes (Int): Number of new notes for each transaction.
     *                                  Unless numberOfOutputNotes is defined in that transaction.
     *
     * @returns ([Notes!])
     */
    send = async (transaction, {
        sender = '',
        numberOfInputNotes,
        numberOfOutputNotes,
    } = {}) => proofFactory(
        'send',
        send,
        {
            assetAddress: this.address,
            transaction,
            sender,
            numberOfInputNotes,
            numberOfOutputNotes,
        },
    );


    /**
     *
     * Mint
     * This api is available only when the asset is ZkAssetMintable
     *
     * - amount (Int! or [Int!])
     * - options
     *       sender (Address):          The proof sender.
     *                                  If empty, will use extension's current user.
     *       numberOfOutputNotes (Int): Number of new notes.
     *                                  If input amount is an array, this value will be ignored.
     *
     * @returns ([Notes!])
     */
    mint = async (amount, {
        sender = '',
        numberOfOutputNotes = 1,
    } = {}) => {
        if (!this.canAdjustSupply) {
            throw new ApiError('api.mint.notValid');
        }

        return proofFactory(
            'mint',
            mint,
            {
                assetAddress: this.address,
                amount,
                sender,
                numberOfOutputNotes,
            },
        );
    };

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
