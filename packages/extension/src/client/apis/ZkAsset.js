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

    /**
     * @function zkAsset.balance
     * @description zkAsset.balance: Get the balance of a ZkAsset
     *
     * @returns {Integer} Balance Balance of the ZkAsset 
     */
    async balance() {
        const { balance } = await ConnectionService.query(
            'assetBalance',
            { id: this.id },
        ) || {};

        return balance || 0;
    }

    /**
     * @function zkAsset.totalSupplyOfLinkedToken
     * @description zkAsset.totalSupplyOfLinkedToken Description: Get the total supply of the ERC20 token linked to the ZkAsset
     *
     * @returns {Integer} totalSupply Token number of ERC20 tokens
     */
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

    /**
     * @function zkAsset.balanceOfLinkedToken
     * @description zkAsset.balanceOfLinkedToken Description: Get the linked ERC20 token balance for an address
     * @param {String} account Ethereum address for which the balance of the linked ERC20 token is being fetched
     *
     * @returns {Integer} Balance Number of linked ERC20 tokens held by the `account`
     */
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

    /**
     * @function zkAsset.allowanceOfLinkedToken
     * @description zkAsset.allowanceOfLinkedToken Description: Get the number of linked ERC20 tokens a spender is allowed to spend on behalf of an owner
     * @param {String} owner Ethereum address which owns linked ERC20 tokens
     * @param {String} spender Ethereum address that is expected to have previously been approved to spend ERC20 tokens on behalf of the owner
     *
     * @returns {Integer} Allowance Number of linked ERC20 tokens the spender has been approved to spend on the owner's behalf
     */
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
     * @function zkAsset.deposit
     * @description zkAsset.deposit Description: Deposit funds into zero-knowledge form - convert public ERC20 tokens into zero-knowledge AZTEC notes.
     *
     * @param {Array} transactions Transaction information which the user wants to have enacted. Each transaction object consists of:
     * 
     * - (Int) amount: Number of public ERC20 tokens being converted into notes 
     * 
     * - (String) to : Ethereum address to which the user is 'depositing' the zero-knowledge funds. The address will become the owner of the notes
     * 
     * - (Int) (optional) numberOfOutputNotes: Number of output notes to create
     * 
     * @param {Object} options Optional parameters to be passed:
     *       - (Int) numberOfOutputNotes: Number of new notes for each transaction.
     *                                     Unless numberOfOutputNotes is defined in that transaction.
     *                                     Will use default value in setting if undefined.
     *       - (Array) userAccess: Addresses that have been granted view access to the note value
     *
     * @returns {Object} txSwummary Transaction summary information containing:
     * 
     * - (Boolean) success: describes whether the transaction was successful
     * 
     * - (Int) amount
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
     * @function zkAsset.withdraw
     * @description zkasset.withdraw Description: Withdraw zero-knowledge funds into public form - convert notes into public ERC20 tokens
     *
     * @param {Int} amount Units of value being withdrawn - will equal the number of ERC20 tokens the `to` address receives
     * @param {Object} options Optional arguments to be passed
     * 
     * - (String) to: Ethereum address to the ERC20 tokens should be sent, upon withdrawal. Will use current address if undefined.
     * 
     * - (Int) numberOfInputNotes: Number of notes to be destroyed. Will use default value in setting if undefined.
     *
     * @returns {Object} txSummary Transaction summary information containing:
     * 
     * - (Boolean) success: describes whether the transaction was successful
     * 
     * - (Int) amount
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
    * @function zkAsset.send
    * @description zkAsset.send Description: Send funds confidentially to another Ethereum address
    *
    * @param {Array} transactions Transaction information which the user wants to have enacted. Each transaction object consists of:
    * 
    * - (Int) amount: Units of value to transfer, where 1 unit is equivalent in value to 1 ERC20 token
    * 
    * - (String) to: Ethereum address to which the user is sending zero-knowledge funds
    * 
    * - (Int) (optional) numberOfOutputNotes: Number of output notes of this transaction.
    * 
    * @returns {Object} options Optional arguments to be passed
    * - (Int) numberOfInputNotes: Number of notes to be destroyed. Will use default value in setting if undefined.
    *                                      
    * 
    * - (Int) numberOfOutputNotes:   Number of new notes for each transaction.
    *                                      Unless numberOfOutputNotes is defined in that transaction.
    *                                      Will use default value in setting if undefined.
    * 
    * - (Array) userAccess: The addresses that are able to see the real note value.
    *
    * @returns {Object} txSummary Transaction summary information containing:
    * 
    * - (Boolean) success: describes whether the transaction was successful
    * 
    * - (Int) amount
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
     *       sender (String):          The proof sender.
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
     *       sender (String):          The proof sender.
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
     *       sender (String):          The proof sender.
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
    * @function zkAsset.createNoteFromBalance
    * @description zkAsset.createNoteFromBalance Description: Manually create notes, with particular values drawn from the user's balance
    *
    * @param {Integer} amount Value of the note to be created
    * @param {Object} options Optional arguments to be passed
    * 
    * - (Array) userAccess:       The addresses that are able to see the real note value.
    * 
    * - (Int) numberOfInputNotes:     Number of notes to be destroyed. Will use default value in setting if undefined.
    *                                     
    * - (Int) numberOfOutputNotes:    Number of new notes for each transaction. Unless numberOfOutputNotes is defined in that transaction. Default value is 1.
    *
    * @returns {Array} Notes Arrray of note that have been created, where each note object contains:
    * 
    * - (String) noteHash
    * 
    * - (Int) value
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
    * @function zkAsset.fetchNotesFromBalance
    * @description zkAsset.fetchNotesfromBalance Description: Fetch the notes stored in the `zkAsset` that are owned by the user and match the given query
    *
    * @param {Object} query Optional query object that can be used to refine the parameters of the note fetch. If not supplied, will return
    * all the notes owned by the user
    * - (Int) equalTo: the exact value all notes need to match
    * 
    * - (Int) greaterThan: if no equalTo parameter, the minimum value of notes returned
    * 
    * - (Int) lessThan: if no equalTo parameter, the maximum value of notes returned
    * 
    * - (Int) numberOfNotes: number of notes which match the query to return
    *
    * @returns {Array} notes: Fetched notes that satisfy the parameters of the fetch query. Each note is an object containing:
    * 
    * - (String) noteHash
    * 
    * - (Int) value
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
