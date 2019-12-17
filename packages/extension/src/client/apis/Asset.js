import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ContractError from '~/client/utils/ContractError';
import ApiError from '~/client/utils/ApiError';

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
        this.id = id;
        this.subscriptions = {
            balance: {
                receipt: null,
                subscribers: new Set(),
            },
        };
    }

    isValid() {
        return !!this.address;
    }

    init = async () => {
        if (this.isValid()) return;

        const { asset } = await ConnectionService.query(
            'asset',
            { id: this.id },
        ) || {};

        if (asset) {
            dataProperties.forEach((key) => {
                this[key] = asset[key];
            });
        }
    };

    async balance() {
        const { balance } = await ConnectionService.query(
            'assetBalance',
            { id: this.id },
        ) || {};

        return balance || 0;
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

        return totalSupply | 0; // eslint-disable-line no-bitwise
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

        return balance | 0; // eslint-disable-line no-bitwise
    };

    allowanceOfLinkedToken = async (owner = '', spender = '') => {
        let allowance = 0;
        let ownerAddress = owner;
        if (!ownerAddress) {
            ({
                address: ownerAddress,
            } = Web3Service.account);
        }

        let spenderAddress = spender;
        if (!spenderAddress) {
            spenderAddress = Web3Service.getAddress('ACE');
        }

        try {
            allowance = await Web3Service
                .useContract('ERC20')
                .at(this.linkedTokenAddress)
                .method('allowance')
                .call(
                    ownerAddress,
                    spenderAddress,
                );
        } catch (error) {
            throw new ContractError('erc20.allowance', {
                owner: ownerAddress,
                spender: spenderAddress,
            });
        }

        return allowance | 0; // eslint-disable-line no-bitwise
    };

    /**
     *
     * Deposit
     *
     * - transactions ([Transaction!]!)
     *       amount (Int!):                The equivalent note value to deposit.
     *       to (Address!):                The output note owner.
     *       numberOfOutputNotes (Int):    Number of output notes of this transaction.
     * - options (Object)
     *       numberOfOutputNotes (Int):    Number of new notes for each transaction.
     *                                     Unless numberOfOutputNotes is defined in that transaction.
     *                                     Will use default value in setting if undefined.
     *       userAccess ([Address!]):      The addresses that are able to see the real note value.
     *
     * @returns (Object)
     * - success (Boolean)
     * - amount (Int)
     */
    deposit = async (transactions, {
        numberOfOutputNotes,
        userAccess = [],
    } = {}) => ConnectionService.query(
        'constructProof',
        {
            proofType: 'DEPOSIT_PROOF',
            assetAddress: this.address,
            transactions,
            numberOfOutputNotes,
            userAccess,
        },
    );

    /**
     *
     * Withdraw
     *
     * - amount (Int!):                    The note value to withdraw.
     * - options (Object)
     *       to (Address):                 The linked token owner.
     *                                     Will use current address if undefined.
     *       numberOfInputNotes (Int):     Number of notes to be destroyed.
     *                                     Will use default value in setting if undefined.
     *
     * @returns (Object)
     * - success (Boolean)
     * - amount (Int)
     */
    withdraw = async (amount, {
        to,
        numberOfInputNotes,
    } = {}) => {
        const {
            address,
        } = Web3Service.account;

        return ConnectionService.query(
            'constructProof',
            {
                proofType: 'WITHDRAW_PROOF',
                assetAddress: this.address,
                amount,
                to: to || address,
                numberOfInputNotes,
            },
        );
    };

    /**
    *
    * Send
    *
    * - transactions ([Transaction!]!)
    *       amount (Int!):                The note value to send.
    *       to (Address!):                The output note owner.
    *       numberOfOutputNotes (Int):    Number of output notes of this transaction.
    * - options (Object)
    *       numberOfInputNotes (Int):     Number of notes to be destroyed.
    *                                     Will use default value in setting if undefined.
    *       numberOfOutputNotes (Int):    Number of new notes for each transaction.
    *                                     Unless numberOfOutputNotes is defined in that transaction.
    *                                     Will use default value in setting if undefined.
    *       userAccess ([Address!]):      The addresses that are able to see the real note value.
    *
    * @returns (Object)
    * - success (Boolean)
    * - amount (Int)
    */
    send = async (transactions, {
        numberOfInputNotes,
        numberOfOutputNotes,
        userAccess,
    } = {}) => ConnectionService.query(
        'constructProof',
        {
            proofType: 'TRANSFER_PROOF',
            assetAddress: this.address,
            transactions,
            numberOfInputNotes,
            numberOfOutputNotes,
            userAccess,
        },
    );

    /**
     *
     * Swap
     *
     * - swap               object containing the notes to be swapped
     *       makerBid                   Note Hash of the makers bid
     *       takerBid                   Note Hash of the takers bid
     *       takerAsk                   Note Hash of the takers ask
     *       makerAsk                   Note Hash of the makers ask
     *
     * - options
     *       sender (Address):          The proof sender.
     *       numberOfInputNotes (Int):  Number of notes picked from esisting pool.
     *                                  Will use extension's or user's setting if undefined.
     *       numberOfOutputNotes (Int): Number of new notes for each transaction.
     *                                  Unless numberOfOutputNotes is defined in that transaction.
     *
     * @returns ([Notes!])
     */
    swap = async (
    // swap,
    // {
    //     sender = '',
    // } = {},
    ) => {
        // TODO
    };


    /**
     *
     * Mint
     * This api is available only when the asset is ZkAssetMintable
     *
    * - transactions ([Transaction!])   Transaction = { amount, to, numberOfOutputNotes }
     * - options
     *       sender (Address):          The proof sender.
     *                                  If empty, will use extension's current user.
     *       numberOfOutputNotes (Int): Number of new notes.
     *                                  If input amount is an array, this value will be ignored.
     *
     * @returns ([Notes!])
     */
    mint = async (
    // transactions,
    // {
    //     sender = '',
    //     numberOfOutputNotes = 1,
    // } = {},
    ) => {
        if (!this.canAdjustSupply) {
            throw new ApiError('api.mint.notValid');
        }

        // TODO
    };

    /**
     *
     * Burn
     * This api is available only when the asset is ZkAssetBurnable
     *
     * - notes ([Note!] or [AztecNote!])
     * - options
     *       sender (Address):          The proof sender.
     *                                  If empty, will use extension's current user.
     *       numberOfOutputNotes (Int): Number of new notes.
     *                                  If input amount is an array, this value will be ignored.
     *
     * @returns ([Notes!])
     */
    burn = async (
    // notes,
    // {
    //     sender = '',
    // } = {},
    ) => {
        if (!this.canAdjustSupply) {
            throw new ApiError('api.burn.notValid');
        }

        // TODO
    };

    /**
    *
    * Create Note From Balance
    *
    * - amount (Int!)
    * - options (Object)
    *       userAccess ([Address!]):      The addresses that are able to see the real note value.
    *       numberOfInputNotes (Int):     Number of notes to be destroyed.
    *                                     Will use default value in setting if undefined.
    *       numberOfOutputNotes (Int):    Number of new notes for each transaction.
    *                                     Unless numberOfOutputNotes is defined in that transaction.
    *                                     Default value is 1.
    *
    * @returns ([notes!])
    * - note (Object)
    *       noteHash (String!)
    *       value (Int!)
    */
    createNoteFromBalance = async (amount, {
        userAccess = [],
        numberOfInputNotes,
        numberOfOutputNotes = 1,
    } = {}) => {
        const {
            notes,
        } = await ConnectionService.query(
            'constructProof',
            {
                proofType: 'CREATE_NOTE_FROM_BALANCE_PROOF',
                assetAddress: this.address,
                amount,
                userAccess,
                numberOfInputNotes,
                numberOfOutputNotes,
            },
        ) || {};

        return notes;
    };

    /**
    *
    * Fetch Note From Balance
    *
    * - options (Object)
    *       greaterThan (Int)
    *       lessThan (Int)
    *       equalTo (Int)
    *       numberOfNotes (Int)
    *
    * @returns ([notes!])
    * - note (Object)
    *       noteHash (String!)
    *       value (Int!)
    */
    fetchNotesFromBalance = async ({
        greaterThan,
        lessThan,
        equalTo,
        numberOfNotes,
    } = {}) => ConnectionService.query(
        'fetchNotesFromBalance',
        {
            assetAddress: this.address,
            greaterThan,
            lessThan,
            equalTo,
            numberOfNotes,
        },
    );
}
