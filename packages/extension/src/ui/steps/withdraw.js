import apis from '~uiModules/apis';

const stepApprove = {
    name: 'approve',
    blockStyle: 'linked',
    descriptionKey: 'withdraw.approve.description',
    tasks: [
        {
            run: apis.proof.joinSplit,
        },
    ],
    submitTextKey: 'withdraw.approve.submit',
};

const stepSignNotes = {
    name: 'signNotes',
    blockStyle: 'collapsed',
    descriptionKey: 'withdraw.sign.description',
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
    blockStyle: 'collapsed',
    descriptionKey: 'withdraw.confirm.description',
    tasks: [],
    submitTextKey: 'transaction.send.submit',
};

const stepConfirmViaGSN = {
    ...stepConfirm,
    descriptionKey: 'transaction.gsn.send.description',
};

const stepSend = {
    name: 'send',
    blockStyle: 'sealed',
    descriptionKey: 'withdraw.send.description',
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
            titleKey: 'withdraw.send.step',
            type: 'sign',
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
    blockStyle: 'sealed',
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
