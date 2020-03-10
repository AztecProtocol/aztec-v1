import BN from 'bn.js';
import {
    tokenToNoteValue,
    noteToTokenValue,
    recoverJoinSplitProof,
} from '~/utils/transformData';
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
    'token',
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
     *
     * @function zkAsset.balance
     * @description Description: Get the balance of a ZkAsset.
     *
     * @returns {Integer} balance Balance of the ZkAsset.
     *
     */
    async balance() {
        const { balance } = await ConnectionService.query(
            'assetBalance',
            { id: this.id },
        ) || {};

        return balance || 0;
    }

    /**
     *
     * @function zkAsset.totalSupplyOfLinkedToken
     * @description Description: Get the total supply of the ERC20 token linked to the ZkAsset
     *
     * @returns {Integer} totalSupply Token number of ERC20 tokens
     *
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
     * @description Description: Get the linked ERC20 token balance for an address.
     *
     * @param {String} account Optional Ethereum address for which the balance of the linked ERC20 token is being fetched.
     * Will use the current user's address if not defined.
     *
     * @returns {BigNumber} balance Number of linked ERC20 tokens held by the `account`.
     *
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
     *
     * @function zkAsset.allowanceOfLinkedToken
     * @description Description: Get the number of linked ERC20 tokens a spender is allowed to spend on behalf of an owner.
     *
     * @param {String} owner Optional Ethereum address which owns linked ERC20 tokens.
     * Will use the current user's address if not defined.
     *
     * @param {String} spender Optional Ethereum address that is expected to have previously been approved to spend ERC20 tokens on behalf of the owner.
     * Will use the address of `ACE` contract if not defined.
     *
     * @returns {BigNumber} allowance Number of linked ERC20 tokens the spender has been approved to spend on the owner's behalf.
     *
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

    /**
     *
     * @function zkAsset.subscribeToBalance
     * @description Description: Get notified whenever the balance of an asset is changed.
     *
     * @param {Function} callback A listener, which will receive the new value whenever the balance is changed:
     *
     * - callback(*balance*): Where balance is an Integer.
     *
     */
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
     * @description Description: Deposit funds into zero-knowledge form - convert public ERC20 tokens into zero-knowledge AZTEC notes.
     *
     * @param {[Transaction]} transactions Transaction information which the user wants to have enacted. Each transaction object consists of:
     *
     * - *amount* (Integer): Number of public ERC20 tokens being converted into notes.
     *
     * - *to* (Address): Ethereum address to which the user is 'depositing' the zero-knowledge funds.
     *   The address will become the owner of the notes.
     *
     * - *numberOfOutputNotes* (Integer) (optional): Number of output notes to create.
     *
     * - *aztecAccountNotRequired* (Boolean) (optional): Not to enforce recipient to have an aztec account.
     *   Useful when depositing funds to a contract.
     *
     * @param {Object} options Optional parameters to be passed:
     *
     * - *numberOfOutputNotes* (Integer): Number of new notes for each transaction.
     *   Unless `numberOfOutputNotes` is defined in that transaction.
     *   Will use default value in sdk settings if undefined.
     *
     * - *userAccess* ([Address]): Addresses that have been granted view access to the note value.
     *
     * - *returnProof* (Boolean): Return the JoinSplit proof instead of sending it.
     *
     * - *sender* (Address): The proof sender. Available only when `returnProof` is true.
     *
     * - *publicOwner* (Address): The owner of ERC token. Available only when `returnProof` is true.
     *
     * @returns {Object} txSummary Transaction summary information containing:
     *
     * - *success* (Boolean): Describes whether the transaction was successful.
     *
     * - *outputNotes* ([Note]): Notes deposited into the recipient accounts.
     *
     * - *proof* (JoinSplitProof): Available when `returnProof` is set to true.
     *
     */
    deposit = async (transactions, {
        numberOfOutputNotes,
        userAccess = [],
        returnProof,
        sender,
        publicOwner,
    } = {}) => {
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'deposit',
            });
        }

        const {
            success,
            outputNotes,
            proofData,
        } = await ConnectionService.query(
            'constructProof',
            {
                proofType: 'DEPOSIT_PROOF',
                assetAddress: this.address,
                transactions: parseInputTransactions(transactions),
                numberOfOutputNotes: parseInputInteger(numberOfOutputNotes),
                userAccess,
                returnProof,
                sender,
                publicOwner,
            },
        );

        let proof;
        if (proofData) {
            proof = proofData
                ? await recoverJoinSplitProof(proofData)
                : null;
        }

        return {
            success,
            outputNotes,
            proof,
        };
    };

    /**
     *
     * @function zkAsset.withdraw
     * @description Description: Withdraw zero-knowledge funds into public form - convert notes into public ERC20 tokens.
     *
     * @param {Integer} amount Units of value being withdrawn - will equal the number of ERC20 tokens the `to` address receives.
     *
     * @param {Object} options Optional arguments to be passed:
     *
     * - *to* (Address): Ethereum address to the ERC20 tokens should be sent, upon withdrawal. Will use current address if undefined.
     *
     * - *numberOfInputNotes* (Integer): Number of notes to be destroyed.
     *   The sdk will pick a random number of notes if undefined.
     *
     * - *returnProof* (Boolean): Return the JoinSplit proof instead of sending it.
     *
     * - *sender* (Address): The proof sender. Available only when `returnProof` is true.
     *
     * @returns {Object} txSummary Transaction summary information containing:
     *
     * - *success* (Boolean): Describes whether the transaction was successful.
     *
     * - *proof* (JoinSplitProof): Available when `returnProof` is set to true.
     *
     */
    withdraw = async (amount, {
        to,
        numberOfInputNotes,
        returnProof,
        sender,
    } = {}) => {
        if (!this.linkedTokenAddress) {
            throw new ApiError('zkAsset.private', {
                fn: 'withdraw',
            });
        }

        const {
            address,
        } = Web3Service.account;

        const {
            success,
            proofData,
        } = await ConnectionService.query(
            'constructProof',
            {
                proofType: 'WITHDRAW_PROOF',
                assetAddress: this.address,
                amount: parseInputInteger(amount),
                to: to || address,
                publicOwner: to || address,
                numberOfInputNotes: parseInputInteger(numberOfInputNotes),
                returnProof,
                sender,
            },
        );

        let proof = null;
        if (proofData) {
            proof = proofData
                ? await recoverJoinSplitProof(proofData)
                : null;
        }

        return {
            success,
            proof,
        };
    };

    /**
     *
     * @function zkAsset.send
     * @description Description: Send funds confidentially to another Ethereum address.
     *
     * @param {[Transaction]} transactions Transaction information which the user wants to have enacted. Each transaction object consists of:
     *
     * - *amount* (Integer): Units of value to transfer, where 1 unit is equivalent in value to 1 ERC20 token.
     *
     * - *to* (Address): Ethereum address to which the user is sending zero-knowledge funds.
     *
     * - *numberOfOutputNotes* (Integer) (optional): Number of output notes of this transaction.
     *
     * - *aztecAccountNotRequired* (Boolean) (optional): Not to enforce recipient to have an aztec account.
     *
     * @param {Object} options Optional arguments to be passed:
     *
     * - *numberOfInputNotes* (Integer): Number of notes to be destroyed.
     *   The sdk will pick a random number of notes if undefined.
     *
     * - *numberOfOutputNotes* (Integer): Number of new notes for each transaction.
     *   Unless `numberOfOutputNotes` is defined in that transaction.
     *   Will use default value in sdk settings if undefined.
     *
     * - *inputNoteHashes* ([String]): Notes to be destroyed.
     *   Their total value should be larger than or equal to the total transaction amount
     *   if `numberOfInputNotes` is defined and is equal to the array size.
     *   Otherwise, the sdk will pick extra notes if necessary.
     *
     * - *userAccess* ([Address]): The addresses that are able to see the real note value.
     *
     * - *returnProof* (Boolean): Return the JoinSplit proof instead of sending it.
     *
     * - *sender* (Address): The proof sender. Available only when `returnProof` is true.
     *
     * - *publicOwner* (Address): The owner of ERC token. Available only when `returnProof` is true.
     *
     * @returns {Object} txSummary Transaction summary information containing:
     *
     * - *success* (Boolean): Describes whether the transaction was successful.
     *
     * - *outputNotes* ([Note]): Notes sent to the recipient accounts.
     *
     * - *proof* (JoinSplitProof): Available when `returnProof` is set to true.
     *
     */
    send = async (transactions, {
        numberOfInputNotes,
        numberOfOutputNotes,
        inputNoteHashes,
        userAccess,
        returnProof,
        sender,
        publicOwner,
    } = {}) => {
        const {
            success,
            outputNotes,
            proofData,
        } = await ConnectionService.query(
            'constructProof',
            {
                proofType: 'TRANSFER_PROOF',
                assetAddress: this.address,
                transactions: parseInputTransactions(transactions),
                numberOfInputNotes: parseInputInteger(numberOfInputNotes),
                numberOfOutputNotes: parseInputInteger(numberOfOutputNotes),
                inputNoteHashes,
                userAccess,
                returnProof,
                sender,
                publicOwner,
            },
        );

        let proof;
        if (proofData) {
            proof = proofData
                ? await recoverJoinSplitProof(proofData)
                : null;
        }

        return {
            success,
            outputNotes,
            proof,
        };
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

    /**
     *
     * @function zkAsset.createNoteFromBalance
     * @description Description: Manually create notes, with particular values drawn from the user's balance.
     *
     * @param {Integer} amount Total value of the notes to be created.
     *
     * @param {Object} options Optional arguments to be passed:
     *
     * - *userAccess* ([Address]): The addresses that are able to see the real value of the new notes.
     *
     * - *numberOfInputNotes* (Integer): Number of notes to be destroyed.
     *   The sdk will pick a random number of notes if undefined.
     *
     * - *numberOfOutputNotes* (Integer): Number of new notes to be created. Default value is 1.
     *
     * @returns {[Note]} notes An Array of notes that have been created, where each note object contains:
     *
     * - *noteHash* (String)
     *
     * - *value* (Integer)
     *
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
     * @description Description: Fetch the notes stored in the `zkAsset` that are owned by the user and match the given query.
     *
     * @param {Object} query Optional query object that can be used to refine the parameters of the note fetch.
     * If not supplied, will return all the notes owned by the user.
     *
     * - *equalTo* (Integer): The exact value all notes need to match.
     *
     * - *greaterThan* (Integer): If no equalTo parameter, the minimum value of notes returned.
     *
     * - *lessThan* (Integer): If no equalTo parameter, the maximum value of notes returned.
     *
     * - *numberOfNotes* (Integer): Number of notes which match the query to return.
     *
     * @returns {[Note]} notes Fetched notes that satisfy the parameters of the fetch query. Each note is an object containing:
     *
     * - *noteHash* (String)
     *
     * - *value* (Integer)
     *
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

    /**
     *
     * @function zkAsset.toNoteValue
     * @description Description: Convert the ERC20 token value to its equivalent note value.
     *
     * @param {Integer|String|BigNumber} tokenValue Value of ERC20 token to be converted.
     *
     * @returns {Integer} noteValue Equivalent note value of `tokenValue`.
     *
     */
    toNoteValue = (tokenValue) => {
        const {
            decimals,
        } = this.token || {};

        return tokenToNoteValue({
            value: tokenValue,
            scalingFactor: this.scalingFactor,
            decimals: decimals || 0,
        });
    };

    /**
     *
     * @function zkAsset.toTokenValue
     * @description Description: Convert note value to its equivalent ERC20 token value.
     *
     * @param {Integer|String|BigNumber} noteValue Value of note to be converted.
     *
     * @param {Boolean} format Optional parameter to format the output string.
     *
     * @returns {String} tokenValue Equivalent ERC20 token value of `noteValue`.
     *
     */
    toTokenValue = (noteValue, format = false) => {
        const {
            decimals,
        } = this.token || {};

        return noteToTokenValue({
            value: noteValue,
            scalingFactor: this.scalingFactor,
            decimals: decimals || 0,
            format,
        });
    };
}
