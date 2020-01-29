import {
    argv,
} from './cmd';

export default function getNetwork() {
    return argv('network') || process.env.NODE_ENV || 'development';
}
