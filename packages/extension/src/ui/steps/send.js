import apis from '~uiModules/apis';

const stepApprove = {
    name: 'approve',
    descriptionKey: 'send.approve.description',
    tasks: [
        {
            run: apis.proof.transfer,
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
            titleKey: 'send.send.step',
            type: 'sign',
            run: apis.asset.confidentialTransfer,
        },
        {
            titleKey: 'transaction.confirmed',
        },
    ],
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
    gsn: [
        stepApprove,
        stepSignNotes,
        stepConfirm,
        stepSendViaGSN,
    ],
    metamask: [
        stepApprove,
        stepSignNotes,
        stepConfirm,
        stepSend,
    ],
};
