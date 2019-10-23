import Web3Service from '~client/services/Web3Service';
import query from '~client/utils/query';
import ContractError from '~client/utils/ContractError';
import ApiError from '~client/utils/ApiError';
import proofFactory from './assetProofFactory';

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

    refresh = async () => {
        const { response: { asset: { asset } } } = await query({
            type: 'asset',
            args: { id: this.id },
        }) || {};

        if (asset) {
            dataProperties.forEach((key) => {
                this[key] = asset[key];
            });
        }
    };

    async balance() {
        const {
            response: {
                asset: { asset },
            },
        } = await query({
            type: 'assetBalance',
            args: { id: this.id },
        }) || {};

        console.log('balance, asset', asset);
        return (asset && asset.balance) || 0;
    }

    notifySubscribers = (type, response) => {
        const {
            subscribers,
        } = this.subscriptions[type];
        subscribers.forEach(subscriber => subscriber(response, this));
    };

    addListener(type, cb) {
        if (!this.subscriptions[type]) return;

        if (!this.subscriptions[type].receipt) {
            // this.subscriptions[type].receipt = subscribeToContentScript(
            //     {
            //         entity: 'asset',
            //         type,
            //         assetId: this.id,
            //     },
            //     result => this.notifySubscribers(type, result.response),
            // );
        }

        this.subscriptions[type].subscribers.add(cb);
    }

    removeListener(type, cb) {
        if (!this.subscriptions[type]) return;

        this.subscriptions[type].subscribers.delete(cb);

        if (!this.subscriptions[type].subscribers.size) {
            this.subscriptions[type].receipt.unsubscribe();
            this.subscriptions[type] = {
                receipt: null,
                subscribers: new Set(),
            };
        }
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
        numberOfOutputNotes = 2,
    } = {}) => proofFactory(
        'deposit',
        {
            assetAddress: this.address,
            transactions,
            from,
            sender,
            numberOfOutputNotes,
        },
    );

    withdraw = async (amount, {
        sender = '',
        to,
        numberOfInputNotes,
    } = {}) => proofFactory(
        'withdraw',
        {
            assetAddress: this.address,
            amount,
            to,
            sender,
            numberOfInputNotes,
        },
    );

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
    } = {}) => proofFactory(
        'send',
        {
            assetAddress: this.address,
            transactions,
            sender,
            numberOfInputNotes,
            numberOfOutputNotes,
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
    swap = async (swap, {
        sender = '',
    } = {}) => proofFactory(
        'swap',
        {
            assetAddress: this.address,
            swap,
            sender,
        },
    );


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
    mint = async (transactions, {
        sender = '',
        numberOfOutputNotes = 1,
    } = {}) => {
        if (!this.canAdjustSupply) {
            throw new ApiError('api.mint.notValid');
        }

        return proofFactory(
            'mint',
            {
                assetAddress: this.address,
                transactions,
                sender,
                numberOfOutputNotes,
            },
        );
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
    burn = async (notes, {
        sender = '',
    } = {}) => {
        if (!this.canAdjustSupply) {
            throw new ApiError('api.burn.notValid');
        }

        return proofFactory(
            'burn',
            {
                assetAddress: this.address,
                notes,
                sender,
            },
        );
    };

    createNoteFromBalance = async (amount, {
        sender = '',
        userAccess = [],
        numberOfInputNotes = 0,
        numberOfOutputNotes = 1,
    } = {}) => proofFactory(
        'createNoteFromBalance',
        {
            assetAddress: this.address,
            amount,
            sender,
            userAccess,
            numberOfInputNotes,
            numberOfOutputNotes,
        },
    );
}
