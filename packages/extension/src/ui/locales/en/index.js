import merge from 'lodash/merge';
import general from './general';
import transaction from './transaction';
import register from './register';
import proof from './proof';
import deposit from './deposit';
import send from './send';

export default merge(
    general,
    {
        transaction,
        register,
        proof,
        deposit,
        send,
    },
);
