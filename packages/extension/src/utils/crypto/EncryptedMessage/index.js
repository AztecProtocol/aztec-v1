import toHexString from './toHexString';

export default function EncryptedMessage(data) {
    return {
        export: () => data,
        toHexString: () => toHexString(data),
    };
}
