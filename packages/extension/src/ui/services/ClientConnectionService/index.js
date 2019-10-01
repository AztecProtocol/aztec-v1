import { Subject } from 'rxjs';
import browser from 'webextension-polyfill';
import {
    tap,
} from 'rxjs/operators';
import { randomId } from '~utils/random';

class ClientConnection {
    constructor() {
        this.clientId = randomId();
        this.backgroundPort = browser.runtime.connect({
            name: this.clientId,
        });

        this.backgroundSubject = new Subject();
        this.background$ = this.backgroundSubject.asObservable();
        this.background$.pipe(
            // tap(console.log),
        ).subscribe();

        this.backgroundPort.onMessage.addListener((msg) => {
            this.backgroundSubject.next(msg);
        });
    }
}

export default new ClientConnection();
