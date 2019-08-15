import constructor from './constructor';
import toString from './toString';
import _addAccess from './_addAccess';

export default function addAccess(prevMetadata, access) {
    const isString = typeof prevMetadata === 'string';
    const metadata = isString
        ? constructor(prevMetadata)
        : prevMetadata;
    const newMetaData = _addAccess(metadata, access);

    return isString
        ? toString(newMetaData)
        : newMetaData;
}
