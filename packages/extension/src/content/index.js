import enableApi from './tasks/enableApi';
// import listenMessagesFromClient from './tasks/listenMessagesFromClient';

const runScript = () => {
    // listenMessagesFromClient();
    enableApi();
};

if (window.location.hostname.match(/^(www.)?aztecprotocol.com$/)) {
    runScript();
}
