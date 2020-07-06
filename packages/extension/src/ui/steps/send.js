import apis from '~uiModules/apis';

const stepApprove = {
    name: 'approve',
    descriptionKey: 'send.approve.description',
    tasks: [
        {
            run: apis.proof.joinSplit,
        },
    ],
    submitTextKey: 'send.approve.submit',
};

const stepSignNotes = {
    name: 'signNotes',
    descriptionKey: 'send.sign.description',
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
    descriptionKey: 'send.confirm.description',
    tasks: [],
    submitTextKey: 'transaction.send.submit',
};

const stepConfirmViaGSN = {
    ...stepConfirm,
    descriptionKey: 'transaction.gsn.send.description',
};

const stepSend = {
    name: 'send',
    descriptionKey: 'send.send.description',
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
            titleKey: 'send.send.step',
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
    submitTextKey: 'transaction.send.submit',
};

export default {
    returnProof: [
        stepApprove,
        stepSignNotes,
    ],
    gsn: [
        stepApprove,
        stepSignNotes,
        stepConfirmViaGSN,
        stepSendViaGSN,
    ],
    metamask: [
        stepApprove,
        stepSignNotes,
        stepConfirm,
        stepSend,
    ],
};
