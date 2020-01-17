import merge from 'lodash/merge';
import general from './general';
import transaction from './transaction';
import account from './account';
import asset from './asset';
import erc20 from './erc20';
import register from './register';
import domain from './domain';
import * as note from './note';
import proof from './proof';
import deposit from './deposit';
import send from './send';
import withdraw from './withdraw';
import mint from './mint';
import burn from './burn';

export default merge(
    general,
    {
        transaction,
        account,
        asset,
        erc20,
        register,
        domain,
        note,
        proof,
        deposit,
        send,
        withdraw,
        mint,
        burn,
    },
);
