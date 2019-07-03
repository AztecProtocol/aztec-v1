import {
    errorLog,
} from '~utils/log';
import get from './get';
import set from './set';
import update from './update';

const configType = {
    name: {
        type: 'string',
        isRequired: true,
    },
    fields: {
        type: 'array',
        isRequired: true,
    },
    autoIncrementBy: {
        type: 'string',
    },
    dataKey: {
        type: 'string',
    },
};

const validateConfig = config => Object.keys(configType)
    .filter(field => configType[field].isRequired)
    .every((field) => {
        const isInConfig = field in config;
        if (!isInConfig) {
            errorLog(`Field '${field}' must be provided in Model's config.`);
        }
        return isInConfig;
    });

export default function Model(config) {
    if (!validateConfig(config)) {
        return {};
    }

    return {
        get: get.bind({
            config,
        }),
        set: set.bind({
            config,
        }),
        update: update.bind({
            config,
        }),
    };
}
