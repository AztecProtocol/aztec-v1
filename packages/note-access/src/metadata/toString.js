import config, {
    START_OFFSET,
} from '../config/noteMetaData';
import encodeMetaDataToString from '../utils/encodeMetaDataToString';

export default function toString(metaDataObj) {
    return encodeMetaDataToString(metaDataObj, config, START_OFFSET);
}
