import DepositConfirm from '~ui/views/DepositConfirm';
import ERC20AllowanceApprove from '~/ui/views/ERC20AllowanceApprove';
import DepositApprove from '~ui/views/DepositApprove';
import TransactionSend from '~ui/views/TransactionSend';
import apis from '~uiModules/apis';

const stepConfirm = {
    titleKey: 'deposit.confirm.title',
    tasks: [
        {
            name: 'proof',
            run: apis.proof.deposit,
        },
    ],
    content: DepositConfirm,
    submitTextKey: 'deposit.confirm.submit',
};

const stepApproveERC20 = {
    name: 'approveERC20',
    titleKey: 'deposit.approve.erc20.title',
    tasks: [
        {
            type: 'sign',
            name: 'approve',
            run: apis.asset.approveERC20Allowance,
        },
    ],
    content: ERC20AllowanceApprove,
    contentProps: {
        titleKey: 'deposit.approve.erc20.amount',
    },
    submitTextKey: 'deposit.approve.erc20.submit',
};

const stepApprove = {
    titleKey: 'deposit.approve.title',
    tasks: [
        {
            type: 'sign',
            name: 'approve',
            run: apis.ace.publicApprove,
        },
    ],
    content: DepositApprove,
    submitTextKey: 'deposit.approve.submit',
};

const stepSend = {
    titleKey: 'deposit.send.title',
    tasks: [
        {
            name: 'send',
            run: apis.asset.confidentialTransfer,
        },
    ],
    content: TransactionSend,
    contentProps: {
        descriptionKey: 'deposit.send.explain',
    },
    submitTextKey: 'deposit.send.submit',
};

const stepSendViaGSN = {
    titleKey: 'deposit.send.title',
    tasks: [
        {
            name: 'send',
            run: apis.asset.confidentialTransferFrom,
        },
    ],
    content: TransactionSend,
    submitTextKey: 'deposit.send.submit',
};

export default {
    gsn: [
        stepConfirm,
        stepApproveERC20,
        stepApprove,
        stepSendViaGSN,
    ],
    metamask: [
        stepConfirm,
        stepApproveERC20,
        stepApprove,
        stepSend,
    ],
};
