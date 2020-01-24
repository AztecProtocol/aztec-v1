import apis from '~uiModules/apis';
import CreateNoteFromBalanceConfirm from '~/ui/views/CreateNoteFromBalanceConfirm';
import SignNotes from '~/ui/views/SignNotes';
import TransactionSend from '~/ui/views/TransactionSend';

const stepProve = {
    titleKey: 'note.create.fromBalance',
    submitTextKey: 'note.create.fromBalance.submit',
    content: CreateNoteFromBalanceConfirm,
    tasks: [],
};

const stepSign = {
    titleKey: 'note.sign.title',
    submitTextKey: 'note.sign.submit',
    content: SignNotes,
    tasks: [
        {
            type: 'sign',
            name: 'approve',
            run: apis.note.signNotes,
        },
    ],
};

const stepBatchSign = {
    ...stepSign,
    tasks: [
        {
            type: 'sign',
            name: 'approve',
            run: apis.note.batchSignNotes,
        },
    ],
};

const stepSend = {
    titleKey: 'transaction.send',
    submitTextKey: 'transaction.send.submit',
    content: TransactionSend,
    contentProps: {
        descriptionKey: 'transaction.send.explain',
    },
    tasks: [
        {
            name: 'send',
            run: apis.asset.confidentialTransfer,
        },
    ],
};

const stepSendViaGSN = {
    titleKey: 'transaction.gsn.send',
    submitTextKey: 'transaction.gsn.send.submit',
    content: TransactionSend,
    contentProps: {
        descriptionKey: 'transaction.gsn.send.explain',
    },
    tasks: [
        {
            name: 'send',
            run: apis.asset.confidentialTransferFrom,
        },
    ],
};

export default {
    gsn: [
        stepProve,
        stepBatchSign,
        stepSendViaGSN,
    ],
    metamask: [
        stepProve,
        stepSign,
        stepSend,
    ],
};
