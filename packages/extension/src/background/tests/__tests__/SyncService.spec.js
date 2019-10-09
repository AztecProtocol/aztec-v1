import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
import aztec from 'aztec.js';
import TestAuthService from './helpers/AuthService';

import ERC20Mintable from '../../../../build/contracts/ERC20Mintable';
import ZkAssetOwnable from '../../../../build/contracts/ZkAssetOwnable';
import JoinSplit from '../../../../build/contracts/JoinSplit';

import Web3Service from '~background/services/NetworkService';
import { fetchNotes } from '../../services/EventService/utils/note';
import {
    createBulkAssets,
} from '../../services/EventService/utils/asset';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
} from '~config/contracts';
import Web3ServiceFactory from '~background/services/NetworkService/factory';
import createNewAsset from './helpers/createNewAsset';
import mint from './helpers/mint';
import approve from './helpers/approve';
import generateNotes from './helpers/generateNotes';
import {
    errorLog,
    warnLog,
    log,
} from '~utils/log';
import clearDB from '~background/database/utils/clearDB';
import SyncService from '~background/services/SyncService';
import NoteService from '~background/services/NoteService';
import EventService from '~background/services/EventService';
import KeystoreData from './helpers/keystore';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeSpendingPublicKey from '~background/utils/decodeSpendingPublicKey';


jest.mock('~utils/storage');
jest.setTimeout(500000000);

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;


describe('ZkAsset', () => {
    const networkId = 0;
    const providerUrl = 'ws://localhost:8545';
    const prepopulateNotesCount = 1000;
    const eachNoteBalance = 1;
    const epoch = 1;
    const filter = 17;
    const scalingFactor = 1;
    const depositAmount = prepopulateNotesCount * eachNoteBalance;
    const sender = TestAuthService.getAccount();
    let senderAccount;

    let erc20Address;
    let zkAssetAddress = '0xF10b155f8Efc3422458652D6A041E5b8E982859D';
    let outputNotes;
    let depositProof;
    let web3Service;

    const configureWeb3Service = async () => {
        const contractsConfigs = [
            AZTECAccountRegistryConfig.config,
            ACEConfig.config,
        ];

        const ganacheNetworkConfig = {
            title: 'Ganache',
            networkId: 0,
            providerUrl,
            contractsConfigs,
        };

        Web3ServiceFactory.setConfigs([
            ...[ganacheNetworkConfig],
        ]);
    };

    beforeAll(async () => {
        const {
            address: userAddress,
        } = sender;

        configureWeb3Service();
        web3Service = Web3Service(networkId, sender);
        const aceAddress = web3Service.contract('ACE').address;

        log(`aceAddress: ${aceAddress}`);

        const {
            error: aztecAccountError,
            account,
        } = await EventService.fetchAztecAccount({
            address: userAddress,
            networkId,
        });

        if (!account) {
            errorLog('Firstly create account', aztecAccountError);
            return;
        }

        const {
            keyStore,
            session: {
                pwDerivedKey,
            },
        } = await KeystoreData(account);

        const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
        const privateKey = decodePrivateKey(decodedKeyStore, pwDerivedKey);
        const linkedPublicKey = decodeLinkedPublicKey(keyStore, pwDerivedKey);
        const spendingPublicKey = decodeSpendingPublicKey(keyStore, pwDerivedKey);

        senderAccount = {
            address: userAddress,
            privateKey,
            linkedPublicKey,
            spendingPublicKey,
        };

        const {
            error,
            groupedNotes,
        } = await fetchNotes({
            fromBlock: 1,
            toBlock: 'latest',
            networkId,
        });

        if (error) {
            errorLog('Cannot fetch all notes', error);
        }

        const eventsInGanache = groupedNotes.allNotes();
        log(`Already eventsInGanache: ${eventsInGanache.length}`);
        if (eventsInGanache.length >= prepopulateNotesCount) return;

        await web3Service
            .useContract('ACE')
            .method('setCommonReferenceString')
            .send(bn128.CRS);

        if (!zkAssetAddress) {
            log('Creating new asset...');
            ({
                erc20Address,
                zkAssetAddress,
            } = await createNewAsset({
                zkAssetType: 'ZkAssetMintable',
                scalingFactor,
                web3Service,
            }));

            log('New zk mintable asset created!');
            warnLog(
                'Add this address to demo file to prevent creating new asset:',
                zkAssetAddress,
            );
        }

        web3Service.registerContract(JoinSplit);
        web3Service.registerContract(ZkAssetOwnable, { address: zkAssetAddress });

        if (!erc20Address) {
            erc20Address = await web3Service
                .useContract('ZkAssetOwnable')
                .at(zkAssetAddress)
                .method('linkedToken')
                .call();
        }
        web3Service.registerContract(ERC20Mintable, { address: erc20Address });

        mint({
            web3Service,
            erc20Address,
            owner: userAddress,
            amount: depositAmount,
        });

        approve({
            web3Service,
            erc20Address,
            aceAddress,
            amount: depositAmount,
        });

        const notesPerRequest = 5;
        let createdNotes = eventsInGanache.length;

        await web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .method('setProofs')
            .send(
                epoch,
                filter,
            );

        do {
            const inputNotes = [];
            const depositInputOwnerAccounts = [];

            // outputNotes with 1 balances
            const noteValues = new Array(notesPerRequest);
            noteValues.fill(1);

            // eslint-disable-next-line no-await-in-loop
            outputNotes = await generateNotes(noteValues, senderAccount);
            const publicValue = ProofUtils.getPublicValue(
                [],
                noteValues,
            );

            depositProof = new JoinSplitProof(
                inputNotes,
                outputNotes,
                userAddress,
                publicValue,
                userAddress,
            );

            // eslint-disable-next-line no-await-in-loop
            await web3Service
                .useContract('ACE')
                .method('publicApprove')
                .send(
                    zkAssetAddress,
                    depositProof.hash,
                    depositAmount,
                );

            const depositData = depositProof.encodeABI(zkAssetAddress);
            const depositSignatures = depositProof.constructSignatures(
                zkAssetAddress,
                depositInputOwnerAccounts,
            );

            // eslint-disable-next-line no-await-in-loop
            await web3Service
                .useContract('ZkAssetOwnable')
                .at(zkAssetAddress)
                .method('confidentialTransfer')
                .send(
                    depositData,
                    depositSignatures,
                );

            createdNotes += (notesPerRequest + 1);

            log(`Progress prepopulation: ${parseInt(createdNotes * 100 / prepopulateNotesCount)} %`);
        } while (createdNotes < prepopulateNotesCount);
    });

    beforeEach(async () => {
        clearDB();
    });

    it(`check how does it take to fetch ${prepopulateNotesCount} events, filter by owner and store into faked db`, async () => {
        // given
        const {
            address: userAddress,
            privateKey,
            linkedPublicKey,
        } = senderAccount;

        await EventService.addAccountToSync({
            address: sender.address,
            networkId,
        });

        const {
            error: assetError,
            asset,
        } = await EventService.fetchAsset({
            address: zkAssetAddress,
            networkId,
        });

        if (assetError) {
            errorLog('Error occured during fetchAsset', assetError);
            return;
        }

        await createBulkAssets([asset], networkId);

        NoteService.initWithUser(
            userAddress,
            privateKey,
            linkedPublicKey,
        );

        // Action
        const tStart = performance.now();
        let t0 = tStart;
        let t1;
        /**
         * Syncing notes with syncNotes
         */
        await new Promise((resolve, reject) => {
            const onCompleatePulling = (result) => {
                resolve(result);
            };

            const onFailurePulling = (result) => {
                reject(result.error);
            };

            EventService.syncNotes({
                address: userAddress,
                networkId,
                fromAssets: [asset],
                continueWatching: false,
                callbacks: {
                    onCompleatePulling,
                    onFailurePulling,
                },
            });
        });
        t1 = performance.now();
        log(`Syncing notes with syncNotes took: ${((t1 - t0) / 1000)} seconds.`);

        // const notes = await NoteModel.query({ networkId }).toArray();
        // log(`EVENTS: ${JSON.stringify(notes)}`);

        /**
         * Sync account with syncAccount
         */
        t0 = performance.now();
        await new Promise((resolve, reject) => {
            const onCompleate = (result) => {
                log(`Finished SyncService: ${JSON.stringify(result)}`);
                resolve();
            };

            SyncService.syncAccount({
                address: userAddress,
                privateKey,
                networkId,
                onCompleate,
            });
        });
        t1 = performance.now();
        log(`Syncing notes and decryption with sync service took: ${((t1 - t0) / 1000)} seconds.`);
    });
});
