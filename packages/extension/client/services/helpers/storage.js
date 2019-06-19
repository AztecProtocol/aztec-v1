/* global chrome */
// import { encode, decode } from '@msgpack/msgpack';

const storage = {
    set:(data) => {
        return new Promise((resolve, reject)=> {
            chrome.storage.local.set(data, ()=> {
                resolve(data);
            });
        });
    },

    get:(keys) => {
        return new Promise((resolve)=> {
            chrome.storage.local.get(keys, (values) => {
                resolve(values);
            });
        });
    },

};

export default storage;
