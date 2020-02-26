import BN from 'bn.js';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ContractError from '~/client/utils/ContractError';
import ApiError from '~/client/utils/ApiError';
import parseInputTransactions from '~/client/utils/parseInputTransactions';
import parseInputInteger from '~/client/utils/parseInputInteger';
import SubscriptionManager from './SubscriptionManager';

const dataProperties = [
    'address',
    'linkedTokenAddress',
    'scalingFactor',
    'canAdjustSupply',
    'canConvert',
];

export default class ZkAsset {
    constructor({
        id,
        ...asset
    } = {}) {
        dataProperties.forEach((key) => {
            this[key] = asset[key];
        });
        this.id = id;
        this.subscriptions = new SubscriptionManager();
    }

    get valid() {
        return !!this.address;
    }

    isValid() {
        return !!this.address;
    }

    async balance() {
        const { balance } = await ConnectionService.query(
            'assetBalance',
            { id: this.id },
        ) || {};

        return balance || 0;
    }

    async totalSupplyOfLinkedToken() {
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'totalSupplyOfLinkedToken',
            });
        }

        let totalSupply = 0;
        try {
            totalSupply = await Web3Service
                .useContract('ERC20')
                .at(this.linkedTokenAddress)
                .method('totalSupply')
                .call();
        } catch (error) {
            throw new ContractError('erc20.totalSupply');
        }

        return new BN(totalSupply);
    }

    balanceOfLinkedToken = async (account) => {
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'balanceOfLinkedToken',
            });
        }

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

        return new BN(balance);
    };

    allowanceOfLinkedToken = async (owner = '', spender = '') => {
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'allowanceOfLinkedToken',
            });
        }

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

        return new BN(allowance);
    };

    subscribeToBalance = async (subscriber) => {
        if (!this.isValid()) {
            return false;
        }

        return this.subscriptions.add(
            'ASSET_BALANCE',
            this.id,
            subscriber,
        );
    };

    unsubscribeToBalance = async subscriber => this.subscriptions.remove(
        'ASSET_BALANCE',
        this.id,
        subscriber,
    );

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
    } = {}) => {
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'deposit',
            });
        }

        return ConnectionService.query(
            'constructProof',
            {
                proofType: 'DEPOSIT_PROOF',
                assetAddress: this.address,
                transactions: parseInputTransactions(transactions),
                numberOfOutputNotes: parseInputInteger(numberOfOutputNotes),
                userAccess,
            },
        );
    };

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
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'withdraw',
            });
        }

        const {
            address,
        } = Web3Service.account;

        return ConnectionService.query(
            'constructProof',
            {
                proofType: 'WITHDRAW_PROOF',
                assetAddress: this.address,
                amount: parseInputInteger(amount),
                to: to || address,
                numberOfInputNotes: parseInputInteger(numberOfInputNotes),
            },
        );
    };

    /**
    *
    * Send
    *
    * - transactions ([Transaction!]!)
    *       amount (Int!):                  The note value to send.
    *       to (Address!):                  The output note owner.
    *       numberOfOutputNotes (Int):      Number of output notes of this transaction.
    *       aztecAccountNotRequired (Bool): Not to enforce receipient to have an aztec account if set to true.
    * - options (Object)
    *       numberOfInputNotes (Int):       Number of notes to be destroyed.
    *                                       Will use default value in setting if undefined.
    *       numberOfOutputNotes (Int):      Number of new notes for each transaction.
    *                                       Unless numberOfOutputNotes is defined in that transaction.
    *                                       Will use default value in setting if undefined.
    *       userAccess ([Address!]):        The addresses that are able to see the real note value.
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
            transactions: parseInputTransactions(transactions),
            numberOfInputNotes: parseInputInteger(numberOfInputNotes),
            numberOfOutputNotes: parseInputInteger(numberOfOutputNotes),
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
                amount: parseInputInteger(amount),
                userAccess,
                numberOfInputNotes: parseInputInteger(numberOfInputNotes),
                numberOfOutputNotes: parseInputInteger(numberOfOutputNotes),
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
            greaterThan: parseInputInteger(greaterThan),
            lessThan: parseInputInteger(lessThan),
            equalTo: parseInputInteger(equalTo),
            numberOfNotes: parseInputInteger(numberOfNotes),
        },
    );
}
