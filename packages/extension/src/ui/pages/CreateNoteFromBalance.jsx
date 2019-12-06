import React from 'react';
import PropTypes from 'prop-types';
import settings from '~/background/utils/settings';
import {
    valueOf,
} from '~/utils/note';
import {
    gsnConfigShape,
    inputAmountType,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~ui/config/settings';
import parseInputAmount from '~/ui/utils/parseInputAmount';
import apis from '~uiModules/apis';
import makeAsset from '~/ui/utils/makeAsset';
import returnAndClose from '~/ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import createNoteFromBalanceSteps from '~/ui/steps/createNoteFromBalance';

const handleClose = (accumData) => {
    const {
        remainderNote,
        outputNotes,
    } = accumData;
    const targetOutputNotes = !remainderNote
        ? outputNotes
        : outputNotes.filter(note => note.noteHash !== remainderNote.noteHash);
    const notes = targetOutputNotes.map(note => ({
        noteHash: note.noteHash,
        value: valueOf(note),
    }));

    returnAndClose({
        ...accumData,
        notes,
    });
};

const CreateNoteFromBalance = ({
    initialStep,
    currentAccount,
    assetAddress,
    amount: inputAmount,
    numberOfInputNotes: customNumberOfInputNotes,
    numberOfOutputNotes: customNumberOfOutputNotes,
    userAccess,
    gsnConfig,
}) => {
    const {
        address: currentAddress,
    } = currentAccount;
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = createNoteFromBalanceSteps[isGSNAvailable ? 'gsn' : 'metamask'];

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const accounts = await Promise.all(userAccess.map(apis.account.getExtensionAccount));
        const sender = isGSNAvailable ? proxyContract : currentAddress;
        const amount = parseInputAmount(inputAmount);
        const numberOfInputNotes = !Object.is(customNumberOfInputNotes, emptyIntValue)
            ? customNumberOfInputNotes
            : await settings('NUMBER_OF_INPUT_NOTES');
        const numberOfOutputNotes = !Object.is(customNumberOfOutputNotes, emptyIntValue)
            ? customNumberOfOutputNotes
            : await settings('NUMBER_OF_OUTPUT_NOTES');
        const transactions = [
            {
                amount,
                to: currentAddress,
            },
        ];

        const {
            proof,
            inputNotes,
            outputNotes,
            remainderNote,
        } = await apis.proof.createNoteFromBalance({
            assetAddress,
            currentAddress,
            sender,
            amount,
            transactions,
            publicOwner: currentAddress,
            numberOfInputNotes,
            numberOfOutputNotes,
            gsnConfig,
        });

        return {
            assetAddress,
            asset,
            sender,
            amount,
            numberOfInputNotes,
            numberOfOutputNotes,
            userAccess,
            accounts,
            proof,
            inputNotes,
            outputNotes,
            remainderNote,
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
            onExit={handleClose}
        />
    );
};

CreateNoteFromBalance.propTypes = {
    initialStep: PropTypes.number,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    amount: inputAmountType.isRequired,
    numberOfInputNotes: PropTypes.number,
    numberOfOutputNotes: PropTypes.number,
    userAccess: PropTypes.arrayOf(PropTypes.string),
    gsnConfig: gsnConfigShape.isRequired,
};

CreateNoteFromBalance.defaultProps = {
    initialStep: 0,
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
    userAccess: [],
};

export default CreateNoteFromBalance;
