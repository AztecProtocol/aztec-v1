// eslint-disable-next-line import/no-unresolved
const AWS = require('aws-sdk');
const {
    log,
    errorLog,
} = require('../../utils/log');
const {
    AWS_REGION,
} = require('../../config/constants');

AWS.config.update({region: AWS_REGION});
const ddb = new AWS.DynamoDB.DocumentClient();

const params = (apiKey) => ({
    TableName: 'aztec_gsn_api_keys',
    Key: {
        'apiKey': apiKey,
    },
    AttributesToGet: [
        'apiKey', 'origin', 'isEnabled',
    ],
    ConsistentRead: true,
});

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
module.exports = async ({
    origin,
    apiKey,
}) => {
    log(`ORIGIN: ${origin}`);
    try {
        const data = await ddb.get(params(apiKey)).promise();
        if (!data.Item || !origin) {
            return false;
        }
        const {
            origin: resultOrigin,
            isEnabled,
        } = data.Item;
        return isEnabled && origin.includes(resultOrigin);
    } catch (e) {
        errorLog('isAPIKeyValid error', e);
        return false;
    }
};
