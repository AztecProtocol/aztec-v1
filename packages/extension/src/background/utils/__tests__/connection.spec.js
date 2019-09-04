import {
    spy,
    mock,
} from 'sinon';
import { expect } from 'chai';

/* eslint-disable import/first */
global.chrome = require('sinon-chrome');

import { TestScheduler, hot, cold } from 'rxjs/testing';

const connectionUtils = require('../connectionUtils.js');

mock(connectionUtils);
const Connection = require('../connection.js').default;


const msg = {
    requestId: 'd02537dfa0105c1fe9caee5a9ee7495d',
    type: 'aztec-browser-api',
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


describe.only('Connection Tests', () => {
    const testScheduler = new TestScheduler();
    beforeEach(() => {
    });

    afterEach(() => {
        // testScheduler.flush();
    });

    it('Should create instance of the Connection Class', () => {
        const connection = new Connection();
        expect(connection);
    });

    it('On receipt of a mesage it should pipe it through the event handlers', async () => {
        const connection = new Connection();

        const expected = '-r-d';
        const expectedGraph = '-g';
        const expectedMap = {
            r: {
                data: msg,
                sender,
            },
            d: 0,
            g: {

            },
        };

        const result$ = connection.page$;
        connection.pageSubject.next({
            data: msg,
            sender,
        });
        console.log(connectionUtils.addDomainData.called);
        testScheduler.expectObservable(result$).toBe(expected, expectedMap);
        testScheduler.expectObservable(connection.graphQuery$).toBe(expectedGraph, expectedMap);
        // expect(connectionUtils.addDomainData.called).to.equal(true);
    });
});
