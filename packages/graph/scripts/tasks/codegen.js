import instance from '../utils/instance';
import {
    manifestPath,
} from '../utils/path';
import handleErrorOutputAsNormal from '../utils/handleErrorOutputAsNormal';

export default function codegen({
    onError,
    onClose,
}) {
    return instance(
        `./node_modules/.bin/graph codegen ${manifestPath} --debug --output-dir ./types`,
        {
            onReceiveErrorOutput: handleErrorOutputAsNormal,
            onError,
            onClose,
        },
    );
}
