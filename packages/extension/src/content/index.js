import enableApi from './tasks/enableApi';
import delegateMessages from './tasks/delegateMessages';

const runScript = () => {
    delegateMessages();
    enableApi();
};

runScript();
