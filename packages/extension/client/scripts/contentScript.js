import storage from "../services/helpers/storage.js";
import utils from '../services/helpers/utils.js';


window.addEventListener('message', async (event)=> {
    console.log('content_script.js got message:', event);
    if(event.data.type === 'graphql-query') {
        // ensure auth for
        const noteId = utils.notePrefix(event.data.id);
        const {[noteId]:noteHash} = await storage.get(noteId);
        console.log(noteHash);
        const {[noteHash]:note} = await storage.get(noteHash);
        window.postMessage({type: 'graphql-response', response: note, responseId: event.data.requestId}, '*');
        // we should make this generic -execute one query
    }
});

console.log('injecting');
const s = document.createElement('script');

// TODO: add "script.js" to web_accessible_resources in manifest.json
s.src = chrome.runtime.getURL('./build/bundle.injected.js');
// s.onload = function() {
//     this.remove();
// };
document.body.appendChild(s);
