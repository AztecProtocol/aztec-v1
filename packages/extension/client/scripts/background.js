import SyncService from "../services/SyncService/index.js";
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
/*
Export the given key and write it into the "exported-key" space.
*/
async function exportCryptoKey(key) {
    const exported = await window.crypto.subtle.exportKey(
        "raw",
        key
    );
    const exportedKeyBuffer = new Uint8Array(exported);
    return exportedKeyBuffer;
}


console.log('Starting background script');
const runScript = async () => {
    const assets = ['BFEc1yK4Yiu5nCf0wg645TuIGKHW9xs', 'BFEc1yK4Yiu5nCf0wg645TuIGKHWdxs','BFEc1yK4Yiu5nCf0wg645TdIGKHW9xs', 'BFEc1yK4Yiu5nCf0wg645TdIGKHW9ss'];
    chrome.storage.local.clear();
    for (let index = 0; index < 10000; index++) {
        const key = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-384",
            },
            true,
            ["sign", "verify"]
        );
        const exportedKey = await exportCryptoKey(key.publicKey);
        const exportedAsString = ab2str(exportedKey);
        const exportedAsBase64 = window.btoa(exportedAsString);

        await SyncService.createNote({
            value: getRandomInt(0, 1000),
            owner: exportedAsBase64.slice(0,32),
            noteHash: exportedAsBase64.slice(0,32),
            asset: assets[getRandomInt(0,3)],
        });

    }

    chrome.storage.local.getBytesInUse(null,(bytes)=> {
        console.log('using', bytes);
    });

}
runScript();

