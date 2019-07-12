import config from '~config/metadata';

export default function toString(metadataObj) {
    const metadata = {};
    config.forEach(({
        name,
        length,
    }) => {
        let data = '';
        if (metadataObj[name] !== undefined) {
            data = Array.isArray(metadataObj[name])
                ? metadataObj[name].join('')
                : `${metadataObj[name]}`;
        }
        if (typeof length === 'string'
            && !metadataObj[length]
        ) {
            metadata[length] = data.length;
        }
        metadata[name] = data;
    });

    const str = config
        .map(({
            name,
            length,
        }) => {
            const data = metadata[name];
            const len = typeof length === 'number'
                ? length
                : metadata[length];
            return `${data}`.padStart(len, '0');
        })
        .join('');

    return `0x${str}`;
}
