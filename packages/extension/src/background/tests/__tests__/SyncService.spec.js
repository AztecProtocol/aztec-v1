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
import AuthService from '~background/services/AuthService';
import SyncService from '~background/services/SyncService';
import NoteService from '~background/services/NoteService';
import EventService from '~background/services/EventService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeSpendingPublicKey from '~background/utils/decodeSpendingPublicKey';
import AuthService from '~background/services/AuthService';
import validateNoteData from '~background/services/SyncService/utils/validateNoteData.js';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import expectExport from 'expect';


jest.mock('~utils/storage');

jest.setTimeout(500000000);

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;


describe('ZkAsset', () => {
    const networkId = 0;
    const providerUrl = 'ws://localhost:8545';
    const prepopulateNotesCount = 10000;
    const eachNoteBalance = 1;
    const epoch = 1;
    const filter = 17;
    const scalingFactor = 1;
    const depositAmount = prepopulateNotesCount * eachNoteBalance;
    const sender = TestAuthService.getAccount();
    let senderAccount;

    let erc20Address;
    let zkAssetAddress = '0x439505a6AA1A9927b7550182d0a63dcd849E0a32';
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

        const registrationData = {
            password: '5d4hl6xv5r',
            salt: 'y29qm2',
            address: userAddress,
            seedPhrase: 'involve filter stadium reopen symptom better diamond demise evoke ticket alert wine',
        };

        await AuthService.registerExtension(registrationData);
        const keyStore = await AuthService.getKeyStore();
        const {
            pwDerivedKey,
        } = await AuthService.getSession();

        const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
        const privateKey = decodePrivateKey(decodedKeyStore, pwDerivedKey);
        const linkedPublicKey = decodeLinkedPublicKey(keyStore, pwDerivedKey);
        const spendingPublicKey = decodeSpendingPublicKey(keyStore, pwDerivedKey);

        log(`Private key start: ${privateKey}`);

        senderAccount = {
            address: userAddress,
            linkedPublicKey,
            spendingPublicKey,
            blockNumber: 1,
        };

        await Account.add(senderAccount, { networkId });
        await AuthService.registerAddress(senderAccount);

        senderAccount = {
            ...senderAccount,
            privateKey,
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
            return;
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

            try {
                // eslint-disable-next-line no-await-in-loop
                outputNotes = await generateNotes(noteValues, senderAccount);
            } catch (error) {
                errorLog('Error during generation notes', error);
            }
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

            // eslint-disable-next-line radix
            log(`Progress prepopulation: ${parseInt(createdNotes * 100 / prepopulateNotesCount)} %`);
        } while (createdNotes < prepopulateNotesCount);
    });


    it(`check how does it take to fetch ${prepopulateNotesCount} events, filter by owner and store into faked db`, async () => {
        // given
        const {
            address: userAddress,
            privateKey,
            linkedPublicKey,
        } = senderAccount;

        log(`Sender address: ${userAddress} private key: ${privateKey}`);

        await EventService.addAccountToSync({
            address: userAddress,
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


        /**
         * Sync account with syncAccount
         */
        t0 = performance.now();
        await new Promise((resolve) => {
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

    it.skip('validateNoteData', async () => {
        const {
            address,
        } = sender;

        const registrationData = {
            password: '5d4hl6xv5r',
            salt: 'y29qm2',
            address,
            seedPhrase: 'involve filter stadium reopen symptom better diamond demise evoke ticket alert wine',
        };

        await AuthService.registerExtension(registrationData);
        const keyStore = await AuthService.getKeyStore();
        const {
            pwDerivedKey,
        } = await AuthService.getSession();

        const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
        const privateKey = decodePrivateKey(decodedKeyStore, pwDerivedKey);
        // const linkedPublicKey = decodeLinkedPublicKey(keyStore, pwDerivedKey);
        // const spendingPublicKey = decodeSpendingPublicKey(keyStore, pwDerivedKey);

        // senderAccount = {
        //     address,
        //     linkedPublicKey,
        //     spendingPublicKey,
        // };
        // await AuthService.registerAddress({
        //     ...senderAccount,
        //     blockNumber: 1,
        // });

        // const [note] = await generateNotes([1], senderAccount);
        // const viewKey = note.getView();
        // const encryptetView = encryptedViewingKey(linkedPublicKey, viewKey);
        // log(`encryptetView: ${encryptetView.decrypt(privateKey)}`);
        // log(`encryptetView: ${JSON.stringify(encryptetView)}`);

        // expect(encryptetView.decrypt(privateKey)).toEqual(viewKey);

        const noteData = {
            viewingKey: '0x5fcf41a2df244edc273321f0e04f7fae8a2163a2ffbcb77ef103e3313c375d8b77f15b22d1b69244aff3e068169ec339d42bb8919fce90339ced021202ebc8674806da41d9187bf5cd44e4473926ac67fad5eea6df8f568c28fe202ef4c8e8601c5e91dcc5a69375e23e277b058aba576eeee19e0cfb3b748617e9c1bb27bb457e863eb38f1528b81cc5ffe921f9dc28b48c9dd18dea3b0eb8a29fba6af7e30184a45ea3c09d04ba87f7b08559b7e253d11ae8c7863025962b17f9e30ac8b17af018b51c494239ace287ebbba6836a33d634',
            status: 'CREATED',
        };

        const result = await validateNoteData(noteData, privateKey);

        log(`RESULT: ${JSON.stringify(result)}`);
    });
});
