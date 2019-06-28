/* global chrome */
import '../utils/hot-reload';
import syncNotes from '../helpers/syncNotes';

console.log('Starting background script 2');

const runScript = async () => {
    chrome.storage.local.clear();

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse before', bytes);
    });

    await syncNotes();

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse after', bytes);
    });

    chrome.storage.local.get(null, data => console.info(data));
};

runScript();
