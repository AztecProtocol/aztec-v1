/* eslint-disable no-alert */
import {
    randomInt,
} from '~/utils/random';
import sleep from '~/utils/sleep';
import realApis from '~/ui/apis';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import {
    addresses,
    assets,
    randomRawNote,
    generate,
} from './data';

const mock = async (data) => {
    await sleep(randomInt(2000));
    const fakeData = {
        ...data,
        mock: true,
        timestamp: Date.now(),
    };
    return fakeData;
};

const mergeApis = (defaultApis, customApis = {}) => {
    const mockApis = {};
    Object.keys(defaultApis).forEach((name) => {
        if (typeof defaultApis[name] === 'object') {
            mockApis[name] = mergeApis(defaultApis[name], customApis[name]);
        } else {
            mockApis[name] = customApis[name] || mock;
        }
    });

    return mockApis;
};

export default mergeApis(realApis, {
    auth: {
        getCurrentUser: () => ({
            address: addresses[0],
        }),
        createKeyStore: () => ({
            linkedPublicKey: 'linked_public_key',
        }),
        generateLinkedPublicKey: realApis.auth.generateLinkedPublicKey,
    },
    account: {
        getExtensionAccount: address => ({
            address,
            linkedPublicKey: 'linked_public_key',
            spendingPublicKey: 'spending_public_key',
        }),
        batchGetExtensionAccount: addressArr => addressArr.map((address => ({
            address,
            linkedPublicKey: 'linked_public_key',
            spendingPublicKey: 'spending_public_key',
        }))),
    },
    asset: {
        getAssets: async () => assets,
        getDomainAssets: async () => assets,
        approveERC20Allowance: ({
            requestedAllowance,
        }) => {
            const signed = window.confirm('Approve ERC20 Allowance?');
            return {
                requestedAllowance: signed ? requestedAllowance : 0,
                error: signed ? null : {
                    message: 'User denied transaction.',
                },
            };
        },
    },
    note: {
        fetchNote: noteHash => ({
            noteHash,
            value: randomInt(100),
            asset: assets[0],
        }),
        signProof: () => {
            const approval = window.confirm('Sign notes?');
            return {
                approval,
                error: approval ? null : {
                    message: 'User denied transaction.',
                },
            };
        },
    },
    proof: {
        createNoteFromBalance: ({
            numberOfInputNotes: customNumberOfInputNotes,
            numberOfOutputNotes: customNumberOfOutputNotes,
        }) => {
            const numberOfInputNotes = !Object.is(customNumberOfInputNotes, emptyIntValue)
                ? customNumberOfInputNotes
                : 5;
            const numberOfOutputNotes = !Object.is(customNumberOfOutputNotes, emptyIntValue)
                ? customNumberOfOutputNotes
                : 5;
            const remainderNote = numberOfOutputNotes > 0
                ? randomRawNote()
                : null;
            const inputNotes = generate(numberOfInputNotes, randomRawNote);
            const outputNotes = generate(numberOfOutputNotes, randomRawNote);
            if (remainderNote) {
                outputNotes.push(remainderNote);
            }

            return {
                proof: {
                    inputNotes,
                    outputNotes,
                },
                inputNotes,
                outputNotes,
                remainderNote,
            };
        },
    },
});
