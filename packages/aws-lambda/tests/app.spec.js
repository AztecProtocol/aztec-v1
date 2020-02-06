'use strict';

const chai = require('chai');
// const balance = require('../balance.js');

const {expect} = chai;
let event; let context;

describe('Balance test index', function() {
    it('returns an origin error if the api is incorrect', async () => {
        console.log(balance, event)
        const result = await balance.balanceHandler(event, context);
        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        const response = JSON.parse(result.body);

        expect(response).to.be.an('object');
        expect(response.message).to.be.equal('hello world');
        // expect(response.location).to.be.an("string");
    });
});
