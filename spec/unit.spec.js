'use strict';

//dependencies
var path = require('path');
var _ = require('lodash');
// var async = require('async');
var expect = require('chai').expect;
var faker = require('faker');
var SMS = require(path.join(__dirname, '..'));

describe('byteskode sms', function() {

    beforeEach(function(done) {
        SMS.remove(done);
    });

    it('should be exported', function() {
        expect(SMS).to.exist;
    });

    it('should be able to send and resend SMS', function() {
        expect(SMS.send).to.exist;
        expect(SMS.resend).to.exist;
    });

    it('should be able to validate sent sms', function(done) {
        var mail = new SMS();
        mail.validate(function(error) {
            expect(error).to.exist;
            expect(error.name).to.equal('ValidationError');
            done();
        });
    });


    it('should be able to send SMS in test and development mode', function(done) {

        var sms = {
            from: 'TEST',
            to: ['+255 716 000 000', '+255 685 111 111'],
            text: faker.lorem.sentence()
        };

        SMS
            .send(sms, function(error, _sms, messages) {
                //assert
                expect(error).to.not.exist;
                expect(_sms).to.exist;
                expect(messages).to.exist;

                expect(_sms.sentAt).to.exist;
                expect(messages).to.have.length(2);
                expect(_.map(messages, 'to')).to.eql(sms.to);
                expect(_.map(messages, 'status')).to.have.length(2);

                //assert message sms id
                expect(messages[0].sms).to.eql(_sms._id);
                expect(messages[1].sms).to.eql(_sms._id);


                done(error, _sms);
            });
    });




    it('should be able to resend sms(s) in test and development mode', function(done) {
        var sms = {
            from: 'TEST',
            to: ['+255 716 000 000', '+255 685 111 111'],
            text: faker.lorem.sentence()
        };

        SMS.queue(sms, function(error) {

            if (error) {
                return done(error);
            }

            SMS.resend(function(error, _sms) {

                var messages = _sms[0][1];
                _sms = _sms[0][0];

                //assert
                expect(error).to.not.exist;
                expect(_sms).to.exist;
                expect(messages).to.exist;

                expect(_sms.sentAt).to.exist;
                expect(messages).to.have.length(2);
                expect(_.map(messages, 'to')).to.eql(sms.to);
                expect(_.map(messages, 'status')).to.have.length(2);

                //assert message sms id
                expect(messages[0].sms).to.eql(_sms._id);
                expect(messages[1].sms).to.eql(_sms._id);

                done(error, _sms);
            });

        });

    });


    it('should be able to queue sms for later send', function(done) {
        var sms = {
            from: 'TEST',
            to: ['+255 716 000 000', '+255 685 111 111'],
            text: faker.lorem.sentence()
        };

        SMS.on('sms:queued', function(_sms) {
            //assert
            expect(_sms.sentAt).to.not.exist;
            expect(_sms.to).to.eql(sms.to);
            expect(_sms.text).to.equal(sms.text);
            done();
        });

        SMS.queue(sms);

    });

});