import {
    contentEvent,
} from '~config/event';

export default function postToClientScript(requestId, response) {
    window.postMessage({
        type: contentEvent,
        requestId,
        response,
    }, '*');
}
