import dataKeyConfig from '~/config/dataKey';

export default function getPrefix(type, config = dataKeyConfig) {
    const pattern = (config && config[type])
        || type;

    if (!pattern
        || !pattern.match(/^([^{}]+)({[^{}]+}){1,}$/)
    ) {
        return '';
    }

    return pattern.replace(/{([^{}]+)}/g, '');
}
