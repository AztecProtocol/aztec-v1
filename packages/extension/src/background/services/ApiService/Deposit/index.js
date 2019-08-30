import filterStream from '~utils/filterStream';
import address from '~utils/address';
import AuthService from '~background/services/AuthService';
import Web3Service from '~client/services/Web3Service';
import {
    permissionError,
    dataError,
} from '~utils/error';
import {
    actionEvent,
} from '~config/event';


const validateDepositProof = async (query, connection) => {
    // we need to validate the resultant note owners
    const {
        args: {
            from,
            amount,
            to,
            numberOfOutputNotes = 2,
        },
    } = query;
    const fromAddress = address(from);

    if (from && !fromAddress) {
        throw dataError('input.address.notValid', {
            address: from,
        });
    }
    const toAddress = address(to);

    if (to && !toAddress) {
        throw dataError('input.address.notValid', {
            address: to,
        });
    }

    const noteOwners = await transactions.map(async transaction => validateExtensionAccount(transaction.owner));

    return notewOwners;
};

const depositProofUi = (query, connection) => async (notesOwners) => {
    connection.UiActionSubject.next({
        type: 'ui.deposit',
        requestId: query.requestId,
        clientId: query.clientId,
        data: {
            ...query.args,
        },
    });
    return await filterStream('UI_RESPONSE', query.requestId, connection.UiResponseSubject.asObservable());
    // we now no the UI has pressed next
};

// const constructDepositProof = (query, connection) => async (noteOwners) => {
//     // we need to construct the notes and the proof
//     // TODO change create notes to accept note owners
//     const amount = transactions.reduce((value, tx) => value + tx.amount, 0);
//     const noteValues = Array.isArray(amount)
//         ? amount
//         : randomSumArray(amount, numberOfOutputNotes);
//     const notes = await createNotes(
//         noteValues,
//         spendingPublicKey,
//         noteOwners,
//     );
// };

// const approveACEToSpendERC20 = (query, connection) => async (depositProof) => {
//     // we need to
// };

// const publicApprove = (query, connection) => async (depositProof) => {
//     // we need to validate the resultant note owners
// };

// const sendDepositProof = (query, connection) => async (depositProof) => {
//     // we need to validate the resultant note owners
// };

const createAndSendDepositProof = async (query, connection) => {
    await validateDepositProof(query, connection)
        .then(depositProofUi(query, connection));
    // .then(approveACEToSpendERC20(query, connection))
    // .then(publicApprove(query, connection))
    // .then(sendDepositProof(query, connection));
};


export default createAndSendDepositProof;
