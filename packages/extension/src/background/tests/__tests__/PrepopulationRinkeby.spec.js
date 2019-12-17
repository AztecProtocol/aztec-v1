import aztec from 'aztec.js';
import TestAuthService from './helpers/AuthService';
import {
    set,
} from '~utils/storage';
import ERC20Mintable from '~contracts/ERC20Mintable';
import ZkAssetOwnable from '~contracts/ZkAssetOwnable';
import ACE from '~contracts/ACE';

import Web3Service from '~helpers/Web3Service';
import { fetchNotes } from '../../services/EventService/utils/note';
import {
    createBulkAssets,
} from '../../services/EventService/utils/asset';
import mint from './helpers/mint';
import approve from './helpers/approve';
import generateNotes from './helpers/generateNotes';
import {
    errorLog,
    log,
} from '~utils/log';
import Account from '~background/database/models/account';
import NoteService from '~background/services/NoteService';
import EventService from '~background/services/EventService';
import getSenderAccount from './helpers/senderAccount';
import configureWeb3Networks from '~utils/configureWeb3Networks';
import NETWORKS from '~config/networks';


jest.mock('~utils/storage');

jest.setTimeout(900000000);

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;

const {
    INFURA_API_KEY,
} = process.env;


describe('PrepopulationRinkeby', () => {
    const prepopulateNotesCount = 10000;
    const eachNoteBalance = 1;
    const depositAmount = prepopulateNotesCount * eachNoteBalance;
    const sender = TestAuthService.getAccount();
    const rinkebyConfig = NETWORKS.RINKEBY;
    const networkId = rinkebyConfig.id;
    const aceAddress = '0xA3D1E4e451AB20EA33Dc0790b78fb666d66A650D';
    const erc20Address = '0xaa161FA77204c5fb0199026051ec781E64AD1217';
    const zkAssetAddress = '0xae5fEB559F4486730333cabFaa407A9e10c0E874';

    let account;
    let outputNotes;
    let depositProof;
    let web3Service;

    beforeAll(async () => {
        if (!INFURA_API_KEY) {
            errorLog('Please set INFURA_API_KEY in .env file');
            return;
        }

        await set({
            __infuraProjectId: INFURA_API_KEY,
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
        web3Service.registerContract(ACE, { address: aceAddress });

        await Account.add(account, { networkId });

        let prefilledNotesLength = 0;
        if (zkAssetAddress) {
            const {
                error,
                groupedNotes,
            } = await fetchNotes({
                owner: userAddress,
                fromBlock: 1,
                toBlock: 'latest',
                fromAssets: [zkAssetAddress],
                networkId,
            });

            if (error) {
                errorLog('Cannot fetch all notes', error);
                return;
            }

            prefilledNotesLength = groupedNotes.allNotes().length;
        }
        log(`Already events on network: ${prefilledNotesLength}`);

        if (prefilledNotesLength >= prepopulateNotesCount) return;


        // web3Service.registerContract(JoinSplit);
        web3Service.registerContract(ZkAssetOwnable, { address: zkAssetAddress });
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
        let createdNotes = prefilledNotesLength;

        do {
            const inputNotes = [];
            const depositInputOwnerAccounts = [];
            const notesToGenerate = Math.min(notesPerRequest, prepopulateNotesCount - createdNotes);

            // outputNotes with `eachNoteBalance` balances
            const noteValues = new Array(notesToGenerate);
            noteValues.fill(eachNoteBalance);

            try {
                // eslint-disable-next-line no-await-in-loop
                outputNotes = await generateNotes(noteValues, account);
            } catch (createNotesError) {
                errorLog('Error during generation notes', createNotesError);
                return;
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
                .sendSigned(
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
                .sendSigned(
                    depositData,
                    depositSignatures,
                );

            createdNotes += notesToGenerate;

            // eslint-disable-next-line radix
            log(`Progress prepopulation: ${parseInt(createdNotes * 100 / prepopulateNotesCount)} %`);
        } while (createdNotes < prepopulateNotesCount);
    });

    it(`check how does it take to fetch ${prepopulateNotesCount} events, filter by owner and store into faked db`, async () => {
        // // given
        // const {
        //     address: userAddress,
        //     privateKey,
        //     linkedPublicKey,
        // } = account;

        // await EventService.addAccountToSync({
        //     address: userAddress,
        //     networkId,
        // });

        // const {
        //     error: assetError,
        //     asset,
        // } = await EventService.fetchAsset({
        //     address: zkAssetAddress,
        //     networkId,
        // });

        // if (assetError) {
        //     errorLog('Error occured during fetchAsset', assetError);
        //     return;
        // }

        // await createBulkAssets([asset], networkId);

        // // Action
        // const tStart = performance.now();
        // let t0 = tStart;
        // let t1;
        // /**
        //  * Syncing notes with syncNotes
        //  */
        // await new Promise((resolve, reject) => {
        //     const onCompleatePulling = (result) => {
        //         resolve(result);
        //     };

        //     const onFailurePulling = (result) => {
        //         reject(result.error);
        //     };

        //     EventService.syncNotes({
        //         address: userAddress,
        //         networkId,
        //         fromAssets: [asset],
        //         continueWatching: false,
        //         callbacks: {
        //             onCompleatePulling,
        //             onFailurePulling,
        //         },
        //     });
        // });
        // t1 = performance.now();
        // log(`Syncing notes with syncNotes took: ${((t1 - t0) / 1000)} seconds.`);

        // /**
        //  * NoteService
        //  */
        // t0 = performance.now();
        // await NoteService.initWithUser(
        //     userAddress,
        //     privateKey,
        //     linkedPublicKey,
        //     networkId,
        // );

        // await NoteService.syncAsset(
        //     userAddress,
        //     zkAssetAddress,
        // );
        // t1 = performance.now();
        // log(`Syncing notes and decryption with NoteService took: ${((t1 - t0) / 1000)} seconds.`);

        // await NoteService.save();

        // const balance = await NoteService.getBalance(
        //     userAddress,
        //     zkAssetAddress,
        // );
        // expect(balance).toEqual(depositAmount);
    });
});
