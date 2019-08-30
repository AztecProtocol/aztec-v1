import {
    registerExtension,
} from '../tasks';

const taskMap = {
    REGISTER_EXTENSION: registerExtension,
};

export default async function runMetaMaskAction(data) {
    return taskMap[data.type](data);
}
