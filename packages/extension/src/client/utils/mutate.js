import postToContentScript from './postToContentScript';

export default async function mutate(mutation) {
    return postToContentScript({
        mutation,
    });
}
