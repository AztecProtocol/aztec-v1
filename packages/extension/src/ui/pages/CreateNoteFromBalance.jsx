import React from 'react';
import PropTypes from 'prop-types';
import settings from '~/background/utils/settings';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~ui/config/settings';
import apis from '~uiModules/apis';
import makeAsset from '~/ui/utils/makeAsset';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import createNoteFromBalanceSteps from '~/ui/steps/createNoteFromBalance';

const CreateNoteFromBalance = ({
    initialStep,
    currentAccount,
    assetAddress,
    amount,
    owner,
    numberOfInputNotes: customNumberOfInputNotes,
    numberOfOutputNotes: customNumberOfOutputNotes,
    userAccess,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = createNoteFromBalanceSteps[isGSNAvailable ? 'gsn' : 'metamask'];

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const accounts = await Promise.all(userAccess.map(apis.account.getExtensionAccount));
        const sender = currentAccount.address;

        const numberOfInputNotes = !Object.is(customNumberOfInputNotes, emptyIntValue)
            ? customNumberOfInputNotes
            : await settings('NUMBER_OF_INPUT_NOTES');
        const numberOfOutputNotes = !Object.is(customNumberOfOutputNotes, emptyIntValue)
            ? customNumberOfOutputNotes
            : await settings('NUMBER_OF_OUTPUT_NOTES');

        const {
            proof,
            inputNotes,
            outputNotes,
            remainderNote,
        } = await apis.proof.createNoteFromBalance({
            assetAddress,
            sender,
            amount,
            owner,
            numberOfInputNotes,
            numberOfOutputNotes,
            gsnConfig,
        });

        return {
            assetAddress,
            asset,
            sender,
            amount,
            owner,
            numberOfInputNotes,
            numberOfOutputNotes,
            userAccess,
            accounts,
            proof,
            inputNotes,
            outputNotes,
            remainderNote,
            gsnConfig,
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
        />
    );
};

CreateNoteFromBalance.propTypes = {
    initialStep: PropTypes.number,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    owner: PropTypes.string.isRequired,
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
