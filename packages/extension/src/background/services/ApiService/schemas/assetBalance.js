import makeSchema from '~/utils/makeSchema';
import addressType from './types/address';

export default makeSchema({
    id: addressType.isRequired,
});
