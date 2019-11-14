import query from '../utils/query';

export default async function registerExtension() {
    const data = await query({
        type: 'registerExtension',
    }) || {};


    return data;
}
