import Model from '../../helpers/Model';


export default Model({
    name: 'account',
    version: 1,
    pk: 'address',
    fields: [
        'address',
        'linkedPublicKey',
        'blockNumber',
        'spendingPublicKey',
    ],
});
