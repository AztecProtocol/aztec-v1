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
};

const depositProofUi = (query, connection) => async (notesOwners) => {
    connection.UiActionSubject.next({
        type: 'ui.asset.deposit',
        requestId: query.requestId,
        clientId: query.clientId,
        data: {
            ...query.args,
        },
    });

    return await filterStream('UI_RESPONSE', query.requestId, connection.UiResponseSubject.asObservable());
    // we now know the UI has pressed next
};


const createAndSendDepositProof = async (query, connection) => {
    await validateDepositProof(query, connection)
        .then(depositProofUi(query, connection));
};


export default createAndSendDepositProof;
