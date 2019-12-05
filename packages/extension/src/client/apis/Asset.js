import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ContractError from '~client/utils/ContractError';
import ApiError from '~client/utils/ApiError';

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
     * - transactions ([Transaction!])   Transaction = { amount, to, numberOfOutputNotes }
     * - options
     *       sender (Address):          The proof sender.
     *       numberOfInputNotes (Int):  Number of notes picked from esisting pool.
     *                                  Will use extension's or user's setting if undefined.
     *       numberOfOutputNotes (Int): Number of new notes for each transaction.
     *                                  Unless numberOfOutputNotes is defined in that transaction.
     *
     * @returns ([Notes!])
     */
    deposit = async (transactions, {
        from = '',
        sender = '',
        numberOfOutputNotes,
    } = {}) => {
        const {
            address,
        } = Web3Service.account;

        return ConnectionService.query(
            'constructProof',
            {
                proofType: 'DEPOSIT_PROOF',
                assetAddress: this.address,
                transactions,
                from: from || address,
                sender: sender || address,
                numberOfOutputNotes,
            },
        );
    };

    withdraw = async (amount, {
        sender = '',
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
                sender: sender || address,
                to: to || address,
                numberOfInputNotes,
            },
        );
    };

    /**
     *
     * Send
     *
     * - transaction ([Transaction!])   Transaction = { amount, to, numberOfOutputNotes }
     * - options
     *       sender (Address):          The proof sender.
     *       numberOfInputNotes (Int):  Number of notes picked from esisting pool.
     *                                  Will use extension's or user's setting if undefined.
     *       numberOfOutputNotes (Int): Number of new notes for each transaction.
     *                                  Unless numberOfOutputNotes is defined in that transaction.
     *
     * @returns ([Notes!])
     */
    send = async (transactions, {
        sender = '',
        numberOfInputNotes,
        numberOfOutputNotes,
    } = {}) => {
        const {
            address,
        } = Web3Service.account;

        return ConnectionService.query(
            'constructProof',
            {
                proofType: 'TRANSFER_PROOF',
                assetAddress: this.address,
                transactions,
                sender: sender || address,
                numberOfInputNotes,
                numberOfOutputNotes,
            },
        );
    };

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

    createNoteFromBalance = async (amount, {
        userAccess = [],
        numberOfInputNotes,
        numberOfOutputNotes = 1,
    } = {}) => ConnectionService.query(
        'constructProof',
        {
            proofType: 'CREATE_NOTE_FROM_BALANCE_PROOF',
            assetAddress: this.address,
            amount,
            userAccess,
            numberOfInputNotes,
            numberOfOutputNotes,
        },
    );

    fetchNotesFromBalance = async ({
        greaterThan,
        lessThan,
        equalTo,
        numberOfNotes,
    } = {}) => {
        const {
            address,
        } = Web3Service.account;

        return ConnectionService.query(
            'fetchNotesFromBalance',
            {
                assetAddress: this.address,
                owner: address,
                greaterThan,
                lessThan,
                equalTo,
                numberOfNotes,
            },
        );
    };
}
