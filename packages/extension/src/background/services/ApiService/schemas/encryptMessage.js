import makeSchema from '~/utils/makeSchema';

export default makeSchema({
    linkedPublicKey: {
        type: 'string',
        required: true,
    },
    message: {
        type: 'string',
        required: true,
    },
});
