import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
import aztec from 'aztec.js';
import TestAuthService from './helpers/AuthService';
import {
    set,
} from '~utils/storage';
import ERC20Mintable from '~contracts/ERC20Mintable';
import ZkAssetOwnable from '~contracts/ZkAssetOwnable';
import JoinSplit from '~contracts/JoinSplit';
import Web3Service from '~helpers/Web3Service';
import { fetchNotes } from '../../services/EventService/utils/note';
import {
    createBulkAssets,
} from '../../services/EventService/utils/asset';
import createNewAsset from './helpers/createNewAsset';
import mint from './helpers/mint';
import approve from './helpers/approve';
import generateNotes from './helpers/generateNotes';
import {
    errorLog,
    warnLog,
    log,
} from '~utils/log';
import Account from '~background/database/models/account';
import NoteService from '~background/services/NoteService';
import EventService from '~background/services/EventService';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import getSenderAccount from './helpers/senderAccount';
import configureWeb3Networks from '~utils/configureWeb3Networks';
import getGanacheNetworkId from '~utils/getGanacheNetworkId';


jest.mock('~utils/storage');

jest.setTimeout(500000000);

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;


describe('ZkAsset', () => {
    const providerUrl = 'ws://localhost:8545';
    const prepopulateNotesCount = 4500;
    const eachNoteBalance = 1;
    const epoch = 1;
    const filter = 17;
    const scalingFactor = 1;
    const depositAmount = prepopulateNotesCount * eachNoteBalance;
    const sender = TestAuthService.getAccount();
    const networkId = getGanacheNetworkId();

    let account;
    let erc20Address;
    let zkAssetAddress;
    let outputNotes;
    let depositProof;
    let web3Service;

    beforeAll(async () => {
        zkAssetAddress = '0x7BD50530d2527672Cc3E5EBaB2f9333547cacB8f';

        await set({
            __providerUrl: providerUrl,
        });
        const {
            address: userAddress,
        } = sender;
        account = await getSenderAccount(sender);

        await configureWeb3Networks();
        web3Service = await Web3Service({
            account: sender,
            networkId,
        });
        const aceAddress = web3Service.contract('ACE').address;

        log(`aceAddress: ${aceAddress}`);

        await Account.add(account, { networkId });

        let eventsInGanacheLength = 0;
        if (zkAssetAddress) {
            const {
                error,
                groupedNotes,
            } = await fetchNotes({
                fromBlock: 1,
                toBlock: 'latest',
                fromAssets: [zkAssetAddress],
                networkId,
            });

            if (error) {
                errorLog('Cannot fetch all notes', error);
                return;
            }

            eventsInGanacheLength = groupedNotes.allNotes().length;
        }
        log(`Already eventsInGanache: ${eventsInGanacheLength}`);

        if (eventsInGanacheLength >= prepopulateNotesCount) return;

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

        await mint({
            web3Service,
            erc20Address,
            owner: userAddress,
            amount: depositAmount,
        });

        await approve({
            web3Service,
            erc20Address,
            aceAddress,
            amount: depositAmount,
        });

        const notesPerRequest = 5;
        let createdNotes = eventsInGanacheLength;

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
            const notesToGenerate = Math.min(notesPerRequest, prepopulateNotesCount - createdNotes);

            // outputNotes with 1 balances
            const noteValues = new Array(notesToGenerate);
            noteValues.fill(1);

            try {
                // eslint-disable-next-line no-await-in-loop
                outputNotes = await generateNotes(noteValues, account);
            } catch (createNotesError) {
                errorLog('Error during generation notes', createNotesError);
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

            createdNotes += notesToGenerate;

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
        } = account;

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
         * NoteService
         */
        t0 = performance.now();
        await NoteService.initWithUser(
            userAddress,
            privateKey,
            linkedPublicKey,
            networkId,
        );

        await NoteService.syncAsset(
            userAddress,
            zkAssetAddress,
        );
        t1 = performance.now();
        log(`Syncing notes and decryption with NoteService took: ${((t1 - t0) / 1000)} seconds.`);

        await NoteService.save();

        const balance = await NoteService.getBalance(
            networkId,
            userAddress,
            zkAssetAddress,
        );
        expect(balance).toEqual(depositAmount);
    });

    it.skip('validateNoteData', async () => {
        const {
            linkedPublicKey,
            privateKey,
        } = account;

        const [note] = await generateNotes([1], account);
        const viewKey = note.getView();
        const encryptetView = encryptedViewingKey(linkedPublicKey, viewKey);

        expect(encryptetView.decrypt(privateKey)).toEqual(viewKey);
    });
});
