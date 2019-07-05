import enableApi from './tasks/enableApi';
import listenMessagesFromClient from './tasks/listenMessagesFromClient';

const runScript = () => {
    listenMessagesFromClient();
    enableApi();
};

runScript();
