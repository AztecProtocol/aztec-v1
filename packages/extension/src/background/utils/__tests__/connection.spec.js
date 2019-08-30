import {
    spy,
    stub,
    createStubInstance,
} from 'sinon';
import { marbles } from 'rxjs-marbles/jest';

/* eslint-disable import/first */


import * as RXJS from 'rxjs';

/* eslint-disable import/first */
import ApiService from '../../services/ApiService';

import * as connectionUtils from '../connectionUtils';


const Connection = require('../connection.js').default;

const msg = {
    domain: 'aztecprotocol.com',
    type: 'aztec-browser-api',
    query: 'registerExtension',
    args: {
        currentAddress: '0x3339c3c842732f4daacf12aed335661cf4eab66b',
    },
    requestId: '6c1f5c0479bf64c81a5d810b3d1d034f',
    clientId: '1bf30e04ad10b6e7c5379bf38a0120b5',
};
const sender = {
    id: 'pmokbmjbgjaoloahefjemdoojfbbdnhi',
    url: 'https://www.aztecprotocol.com/',
    frameId: 0,
    tab: {
        active: true,
        audible: false,
        autoDiscardable: true,
        discarded: false,
        favIconUrl: 'https://www.aztecprotocol.com/icons/icon-48x48.png?v=4b94a4d6775dc2f5fe85a6f2892d8f7d',
        height: 789,
        highlighted: true,
        id: 1861,
        incognito: false,
        index: 34,
        mutedInfo: {
            muted: false,
        },
        openerTabId: 1658,
        pinned: false,
        selected: true,
        status: 'complete',
        title: 'AZTEC Protocol | Enabling Privacy',
        url: 'https://www.aztecprotocol.com/',
        width: 1440,
        windowId: 1437,
    },
};
const domain = {
    domain: 'aztecprotocol.com',
    requestId: '6c1f5c0479bf64c81a5d810b3d1d034f',
    type: 'aztec-browser-api',
};


describe.only('Connection Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('should register a client and add messages to the message$ stream', () => {
        // we need to simulate the process of a connection
        const connection = new Connection();

        const listenerSpy = jest.fn();
        connection.registerClient({
            onMessage: {
                addListener: listenerSpy,
            },
        });
        expect(listenerSpy).toHaveBeenCalled();
    });


    it('On receipt of an API mesage it should pipe it through the correct handlers', () => {
        const apiSpy = jest.spyOn(ApiService, 'run');
        const addDomainDataSpy = jest.spyOn(connectionUtils, 'addDomainData');
        const connection = new Connection();
        const nextSpy = jest.spyOn(connection.ApiSubject, 'next');
        connection.MessageSubject.next({
            data: msg,
            sender,
        });

        expect(addDomainDataSpy).toHaveBeenCalled();
        expect(nextSpy).toHaveBeenCalled();
        expect(apiSpy).toHaveBeenCalled();
    });
    it.only('On receipt of an ACTION_RESPONSE mesage it should pipe it through the correct handlers', () => {
        const addDomainDataSpy = jest.spyOn(connectionUtils, 'addDomainData');
        const connection = new Connection();
        const nextSpy = jest.spyOn(connection.ActionResponseSubject, 'next');
        connection.MessageSubject.next({
            data: {
                type: 'ACTION_RESPONSE',
            },
            sender,
        });

        expect(addDomainDataSpy).toHaveBeenCalled();
        expect(nextSpy).toHaveBeenCalled();
    });
});
