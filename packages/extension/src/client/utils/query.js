import postToContentScript from './postToContentScript';

export default async function query(queryStr) {
    return postToContentScript({
        query: queryStr,
    });
}
