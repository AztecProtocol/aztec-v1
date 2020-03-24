import noteQuery from '~/background/services/GraphQLService/Queries/noteQuery';
import Web3Service from '~/helpers/Web3Service';
import {
    ZkAsset,
} from '~/config/contractEvents';
import asyncMap from '~/utils/asyncMap';
import query from '../utils/query';

export default async function fetchTransactions(request) {
    const {
        data: {
            args: {
                assetAddress,
                type,
                fromBlock,
                toBlock,
            },
        },
    } = request;

    const {
        address: currentAddress,
    } = Web3Service.account;

    // For deposit transactions we find all create note events and ensure that there are no destroy note events in the
    // same block
    //

    const options = {
        fromBlock,
        toBlock,
    };

    options.filter = {
        owner: currentAddress,
    };

    const createEvents = await Web3Service
        .useContract('ZkAsset')
        .at(assetAddress)
        .events(ZkAsset.createNote)
        .where(options);
    const destroyEvents = await Web3Service
        .useContract('ZkAsset')
        .at(assetAddress)
        .events(ZkAsset.destroyNote)
        .where(options);

    const redeemEvents = await Web3Service
        .useContract('ZkAsset')
        .at(assetAddress)
        .events('RedeemTokens')
        .where(options);
    const events = [].concat(destroyEvents, createEvents, redeemEvents);
    const eventsByTxhash = {};
    events.forEach(({
        transactionHash,
        event,
        ...rest
    }) => {
        if (!eventsByTxhash[transactionHash]) {
            eventsByTxhash[transactionHash] = {
                CreateNote: [],
                DestroyNote: [],
                RedeemTokens: [],
                blockNumber: rest.blockNumber,
            };
        }
        eventsByTxhash[transactionHash][event].push({
            event,
            ...rest,
        });
    });
    const transactions = await asyncMap(Object.keys(eventsByTxhash), async (txHash) => {
        let txType;
        const txEvents = eventsByTxhash[txHash];


        const txTimestamp = (await Web3Service.web3.eth.getBlock(txEvents.blockNumber)).timestamp;
        // async map every note to get its value
        const createValues = await asyncMap(txEvents.CreateNote, ({ returnValues: { noteHash } }) => query({ ...request, data: { args: { id: noteHash } } }, noteQuery(`
       value,
       owner {
        address
       }
    `)));
        const destroyValues = await asyncMap(txEvents.DestroyNote, ({ returnValues: { noteHash } }) => query({ ...request, data: { args: { id: noteHash } } }, noteQuery(`
       value 
    `)));
        const outgoing = destroyValues
            .reduce(
                (accum, {
                    note: {
                        note: {
                            value,
                        },
                    },
                }) => value + accum, 0,
            );

        const incoming = createValues
            .reduce((accum, {
                note: {
                    note: {
                        value,
                    },
                },
            }) => value + accum, 0);


        let value = -outgoing + incoming;
        if (txEvents.CreateNote.length && !txEvents.DestroyNote.length) {
            // this is easy its a deposit
            txType = 'DEPOSIT';
        }
        if (txEvents.DestroyNote.length && !txEvents.CreateNote.length) {
            // this is easy its a withdraw
            txType = 'WITHDRAW';
        }


        if (txEvents.DestroyNote.length && txEvents.CreateNote.length) {
            // this is hard its either a send or a withdraw
            const allOwner = txEvents
                .CreateNote.every(event => event.returnValues.owner === currentAddress);
            txType = allOwner && value ? 'WITHDRAW' : 'SEND';
        }

        if (txEvents.DestroyNote.length
            && txEvents.CreateNote.length
            && value === 0 && txType === 'SEND') {
            value = outgoing;
        }

        let to = [...new Set(createValues.map(({
            note: {
                note: {
                    owner: {
                        address,
                    },
                },
            },
        }) => address))];

        if (!to.length) {
            to = [txEvents.RedeemTokens[0].returnValues.owner];
        }
        return {
            txHash,
            type: txType,
            noteValue: value,
            to,
            timestamp: txTimestamp,
        };
    });
    transactions.sort((a, b) => {
        if (a.timestamp > b.timestamp) return -1;
        if (a.timestamp < b.timestamp) return 1;
        return 0;
    });

    return { data: type ? transactions.filter(tx => tx.type === type) : transactions };
}
