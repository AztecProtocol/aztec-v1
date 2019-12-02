import makeSchema from '~/utils/makeSchema';
import noteHashType from './types/noteHash';

export default makeSchema({
    id: noteHashType.isRequired,
});
