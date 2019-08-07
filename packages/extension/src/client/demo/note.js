import secp256k1 from '@aztec/secp256k1';
import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import {
    createNote,
} from '~utils/note';
import asyncForEach from '~utils/asyncForEach';
import createNewAsset from './helpers/createNewAsset';
import sleep from './utils/sleep';

export default async function demoNote({
    scalingFactor = 1,
} = {}) {
    const { aztec } = window;
    await aztec.enable();


    let zkAssetAddress = '0x4AB2e8E15780d244A4513338B48Cc9120Bf3c2fd'; // ADD EXISTING ASSET ADDRESS HERE
    if (!zkAssetAddress) {
        log('Creating new asset...');
        ({
            zkAssetAddress,
        } = await createNewAsset({
            zkAssetType: 'ZkAssetMintable',
            scalingFactor,
        }));

        log('New zk mintable asset created!');
        warnLog(
            'Add this address to demo file to prevent creating new asset:',
            zkAssetAddress,
        );
    }


    const asset = await aztec.asset(zkAssetAddress);
    if (!asset.isValid()) {
        // TODO
        // wait for data to be processed by graph node
        // this should be handled in background script
        await sleep(2000);
        await asset.refresh();
    }
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }


    let notes;
    const assetBalance = await asset.balance();
    if (assetBalance) {
        log('Creating new notes from balance...');
        const notesAmount = randomInt(2, assetBalance);
        const newNotesProof = await asset.createNoteFromBalance(notesAmount, {
            numberOfOutputNotes: 2,
        });
        await newNotesProof.approve();
        const newNotes = await newNotesProof.send();
        notes = newNotes.slice(-2);
        log('New notes created!');
    } else {
        const mintAmount = randomInt(100, 200);

        log('Generating mint proof...');
        const mintProof = await asset.mint(mintAmount, {
            numberOfOutputNotes: 2,
        });
        log('Mint proof generated!', mintProof.export());

        log('Minting...');
        notes = await mintProof.send();
        log(`Successfully minted ${mintAmount}!`);
    }

    if (notes.some(n => !n.isValid())) {
        await sleep(2000);
        await asyncForEach(notes, async (note) => {
            if (!note.isValid()) {
                await note.refresh();
            }
        });
    }


    const [largerNote, smallerNote] = notes[0].value > notes[1].value
        ? notes
        : [notes[1], notes[0]];

    log('Notes to compare:', {
        largerNote,
        smallerNote,
    });


    log('Generating range proof to test if largerNote > smallerNote...');
    const greaterThanProof = await largerNote.greaterThan(smallerNote);
    log(greaterThanProof.export());

    log('Validating proof...');
    const isGreaterThan = await greaterThanProof.send();
    log(`Proof ${isGreaterThan ? 'validated!' : 'failed :('}`);


    log('Generating range proof to test if smallerNote < largerNote...');
    const lessThanProof = await smallerNote.lessThan(largerNote);
    log(lessThanProof.export());

    log('Validating proof...');
    const isLessThan = await lessThanProof.send();
    log(`Proof ${isLessThan ? 'validated!' : 'failed :('}`);


    const stranger = secp256k1.generateAccount();
    const copySmallerNote = await createNote(
        smallerNote.value,
        stranger.publicKey,
    );
    log('Generating range proof to test if smallerNote === copySmallerNote...', {
        copySmallerNote,
    });

    const equalProof = await smallerNote.equal(copySmallerNote);
    log(equalProof.export());

    log('Validating proof...');
    const isEqual = await equalProof.send();
    log(`Proof ${isEqual ? 'validated!' : 'failed :('}`);


    log('Generating range proof to test if smallerNote >= copySmallerNote...');

    const gteProof = await smallerNote.greaterThanOrEqualTo(copySmallerNote);
    log(gteProof.export());

    log('Validating proof...');
    const isGte = await gteProof.send();
    log(`Proof ${isGte ? 'validated!' : 'failed :('}`);


    log('Generating range proof to test if smallerNote <= copySmallerNote...');

    const lteProof = await smallerNote.lessThanOrEqualTo(copySmallerNote);
    log(lteProof.export());

    log('Validating proof...');
    const isLte = await lteProof.send();
    log(`Proof ${isLte ? 'validated!' : 'failed :('}`);
}
