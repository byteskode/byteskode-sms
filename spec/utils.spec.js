'use strict';

//dependencies
var path = require('path');
var _ = require('lodash');
var expect = require('chai').expect;
var Utils = require(path.join(__dirname, '..', 'lib', 'utils'));
var sendResponse = require(path.join(__dirname, 'fixtures', 'send_response.json'));
var deliveries = require(path.join(__dirname, 'fixtures', 'deliveries.json'));

describe('byteskode sms utils', function() {

    it('should be able to normalize SMS sent response', function() {
        var response = Utils.normalize(sendResponse);

        //assert
        expect(response).to.exist;
        expect(response).to.have.length(3);
        expect(_.map(response, '_id')).to.have.length(3);
        expect(_.map(response, 'count')).to.have.length(3);
        expect(_.map(response, 'status')).to.have.length(3);
    });


    it('should be able to normalize SMS deliveries reports', function() {
        var response = Utils.normalize(deliveries);

        //assert
        expect(response).to.exist;
        expect(response).to.have.length(2);
        expect(_.map(response, '_id')).to.have.length(2);
        expect(_.map(response, 'count')).to.have.length(2);
        expect(_.map(response, 'status')).to.have.length(2);
        expect(_.map(response, 'error')).to.have.length(2);
    });

});