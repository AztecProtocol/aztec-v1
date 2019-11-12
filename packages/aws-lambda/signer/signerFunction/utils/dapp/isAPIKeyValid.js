// eslint-disable-next-line import/no-unresolved
const AWS = require('aws-sdk');
const {
    errorLog,
} = require('../../utils/log');
const {
    AWS_REGION,
} = require('../../config/constants');

AWS.config.update({region: AWS_REGION});
const ddb = new AWS.DynamoDB();

const params = (apiKey) => ({
    TableName: 'aztec_gsn_api_keys',
    Key: {
        'apiKey': {
            S: apiKey,
        },
    },
    AttributesToGet: [
        'apiKey', 'origin',
    ],
    ConsistentRead: true,
});

module.exports = async ({
    origin,
    apiKey,
}) => {
    try {
        const data = await ddb.getItem(params(apiKey)).promise();
        if (!data.Item || !origin) {
            return false;
        }
        const {
            origin: {
                S: resultOrigin,
            } = {},
        } = data.Item;
        return origin.includes(resultOrigin);
    } catch (e) {
        errorLog('isAPIKeyValid error', e);
        return false;
    }
};
