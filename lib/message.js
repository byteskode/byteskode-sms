'use strict';

/**
 * @name Message
 * @description mongoose schema and model to manage instance of sms send to
 *              single receiver
 */

//dependencies
var path = require('path');
var _ = require('lodash');
var async = require('async');
var phone = require('phone');
var e164 = require('e164');
var mongoose = require('mongoose');
var Price = require(path.join(__dirname, 'price_schema'));
var Destination = require(path.join(__dirname, 'destination_schema'));
var Response = require(path.join(__dirname, 'response_schema'));
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


module.exports = exports = function(options) {

    //message schema
    var MessageSchema = new Schema({

        /**
         * @description an sms that resulted to this message to be sent
         *              it maps to buldId of the message send response and
         *              delivery reports bulkId
         * @type {Object}
         */
        sms: {
            type: ObjectId,
            ref: options.models.sms.name,
            required: true
        },


        /**
         * @name to
         * @description receiver of the message
         * @type {Object}
         */
        to: {
            type: String,
            required: true,
            trim: true
        },


        /**
         * @name destination
         * @description computed information about where message is destined
         * @type {Destination}
         */
        destination: Destination,


        /**
         * @name count
         * @description number of message(s) send to accommodate the whole sms
         *              text 
         * @type {Object}
         */
        count: {
            type: Number
        },


        /**
         * @name text
         * @description text of the message that will be sent
         * @type {Object}
         */
        text: {
            type: String,
            required: true,
            trim: true
        },


        /**
         * @name sentAt
         * @description a time at which to send a message to a receiver
         * @type {Object}
         */
        sentAt: {
            type: Date
        },


        /**
         * @name doneAt
         * @description a time when this message successfully delivered to a 
         *              receiver
         * @type {Object}
         */
        doneAt: {
            type: Date
        },


        /**
         * @name price
         * @description price used to send message
         * @type {Price}
         */
        price: Price,


        /**
         * @name status
         * @description status of message
         * @type {[type]}
         */
        status: Response,


        /**
         * @name error
         * @description error status of sent message
         * @type {[type]}
         */
        error: Response

    });


    //-------------------------------------------
    // virtuals
    //-------------------------------------------


    /**
     * @description compute total message send cost
     * @return {Object}
     */
    MessageSchema.virtual('sendCost').get(function() {

        //check if there is a price
        var thereIsPrice =
            this.count &&
            (this.price && this.price.pricePerMessage && this.price.currency);

        //compute message send cost
        if (thereIsPrice) {
            return {
                amount: this.price.pricePerMessage * this.count,
                current: this.price.currency
            };
        }

        //price not set yet
        else {
            return {
                amount: 0,
                currency: 'NA'
            };
        }

    });


    //---------------------------------------------
    // hooks
    //---------------------------------------------

    /**
     * @description pre validate hook
     */
    MessageSchema.pre('validate', function(next) {
        try {
            if (!this.destination && this.to) {
                //convert this.to to e164 format
                var to = phone(this.to)[0];

                //lookup country details
                var destination = e164.lookup(to.replace(/\+/g, ''));

                //set receiver
                destination.to = to;

                //set destination
                this.destination = destination;
            }

            next();

        } catch (e) {
            next(e);
        }
    });


    //-----------------------------------------------
    // instance
    //-----------------------------------------------
    MessageSchema.methods.toSMSDestination = function() {

        return _.merge({}, {
            messageId: this._id
        }, _.pick(this.destination, 'to'));

    };


    //------------------------------------------------
    // statics
    //------------------------------------------------

    /**
     * @name prepare
     * @description prepare sms messages
     * @param  {SMS} sms a valid instance of sms
     * @return {[Message]}  
     */
    MessageSchema.statics.prepare = function(sms) {

        var messages = _.map(sms.to, function(to) {
            return {
                sms: sms._id,
                to: to,
                text: sms.text
            };
        });

        return _.compact(messages);
    };


    /**
     * @name updateStatus
     * @description update message status from sms sent response or deliveries report
     * @param  {Object[]}   responses [description]
     * @param  {Function} done      a callback to invoke on success or error
     */
    MessageSchema.statics.updateStatuses = function(responses, done) {
        //normalize responses
        responses = [].concat(responses);

        //prepare updates
        //TODO handle unkwown ids
        responses = _.map(responses, function(message) {
            return function(_next) {
                Message
                    .findByIdAndUpdate(message._id,
                        _.omit(message, '_id'), {
                            new: true
                        }, _next);
            };
        });
        responses = _.compact(responses);

        async.parallel(responses, function(error, updates) {
            done(error, _.compact(updates));
        });

    };


    //-------------------------------------------------
    // initialize & register Message model
    // ------------------------------------------------
    var Message;
    var modelName = options.models.message.name;
    try {
        if (!mongoose.model(modelName)) {
            Message = mongoose.model(modelName, MessageSchema);
        } else {
            Message = mongoose.model(modelName);
        }
    } catch (e) {
        Message = mongoose.model(modelName, MessageSchema);
    }

    return Message;
};