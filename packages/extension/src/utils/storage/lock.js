import LockManager from './helpers/LockManager';

const {
    lock,
    onIdle,
} = new LockManager();

export {
    onIdle,
};

export default lock;
