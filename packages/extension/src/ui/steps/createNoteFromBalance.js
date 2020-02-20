import apis from '~uiModules/apis';

const stepApprove = {
    name: 'approve',
    descriptionKey: 'note.access.grant.description',
    tasks: [
        {
            run: apis.proof.createNoteFromBalance,
        },
    ],
    submitTextKey: 'note.access.grant.submit',
};

const stepSign = {
    name: 'signNotes',
    descriptionKey: 'note.access.sign.description',
    tasks: [
        {
            type: 'sign',
            run: apis.note.signProof,
        },
    ],
    autoStart: true,
    submitTextKey: 'transaction.sign.submit',
};

const stepConfirm = {
    name: 'confirm',
    descriptionKey: 'note.access.confirm.description',
    tasks: [],
    submitTextKey: 'transaction.send.submit',
};

const stepConfirmViaGSN = {
    ...stepConfirm,
    descriptionKey: 'transaction.gsn.send.description',
};

const stepSend = {
    name: 'send',
    descriptionKey: 'note.access.send.description',
    tasks: [
        {
            titleKey: 'transaction.step.create.proof',
            run: apis.mock,
        },
        {
            titleKey: 'transaction.step.sign',
            run: apis.mock,
        },
        {
            type: 'sign',
            titleKey: 'note.access.grant.step',
            run: apis.asset.confidentialTransferFrom,
        },
        {
            titleKey: 'transaction.confirmed',
        },
    ],
    showTaskList: true,
    autoStart: true,
    submitTextKey: 'transaction.send.submit',
};

const stepSendViaGSN = {
    name: 'send',
    descriptionKey: 'transaction.gsn.send.description',
    tasks: [
        {
            titleKey: 'transaction.step.create.proof',
            run: apis.mock,
        },
        {
            titleKey: 'transaction.step.sign',
            run: apis.mock,
        },
        {
            titleKey: 'transaction.step.relay',
            run: apis.asset.confidentialTransferFrom,
        },
        {
            titleKey: 'transaction.confirmed',
        },
    ],
    showTaskList: true,
    autoStart: true,
    submitTextKey: 'transaction.gsn.send.submit',
};

export default {
    gsn: [
        stepApprove,
        stepSign,
        stepConfirmViaGSN,
        stepSendViaGSN,
    ],
    metamask: [
        stepApprove,
        stepSign,
        stepConfirm,
        stepSend,
    ],
};
