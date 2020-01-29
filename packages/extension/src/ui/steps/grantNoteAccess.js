import apis from '~uiModules/apis';

const stepApprove = {
    name: 'approve',
    descriptionKey: 'note.access.grant.description',
    tasks: [],
    submitTextKey: 'note.access.grant.submit',
};

const stepSend = {
    name: 'send',
    descriptionKey: 'note.access.grant.description',
    tasks: [
        {
            titleKey: 'transaction.step.create.proof',
            run: apis.note.grantNoteAccess,
        },
        {
            type: 'sign',
            titleKey: 'note.access.grant.step',
            run: apis.asset.updateNoteMetadata,
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
    descriptionKey: 'note.access.grant.description',
    tasks: [
        {
            titleKey: 'transaction.step.create.proof',
            run: apis.note.grantNoteAccess,
        },
        {
            titleKey: 'transaction.step.relay',
            run: apis.asset.updateNoteMetadata,
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
        stepSendViaGSN,
    ],
    metamask: [
        stepApprove,
        stepSend,
    ],
};
