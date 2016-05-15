'use strict';

/**
 * @name SMS
 * @description mongoose schema & model implementation for sending SMS
 */

//dependencies
var path = require('path');
var _ = require('lodash');
var async = require('async');
var config = require('config');
var environment = require('execution-environment');
var Transport = require('bipsms');
var mongoose = require('mongoose');
var Utils = require(path.join(__dirname, 'utils'));
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;


//obtain configuration from config
var _config = config.has('sms') ? config.get('sms') : {};


//merge default configurations
_config = _.merge({}, {
    username: '',
    password: '',
    callback: {
        baseUrl: '',
        deliveries: '/sms-deliveries',
    },
    intermediateReport: true,
    fake: environment.isLocal() ? true : false,
    models: {
        sms: {
            name: 'SMS',
            fields: {}
        },
        message: {
            name: 'SMSMessage',
            fields: {}
        }
    }
}, _config);


//initialize bipsms transport
var smsTransport = new Transport(_config);


//load message model
var Message = require(path.join(__dirname, 'message'))(_config);


//default schema fields
var schemaFields = {
    /**
     * @name from
     * @description sender ID which can be alphanumeric or numeric. 
     *              
     *              Alphanumeric sender ID length should be between 3 and 11 
     *              characters.
     *              
     *              Numeric sender ID length should be between 3 and 14 
     *              characters.
     *               
     * @type {Object}
     */
    from: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 14
    },


    /**
     * @name to
     * @description sms destination addresses. 
     *              Addresses must be in international format(E.164)
     * @type {Object}
     */
    to: {
        type: [String],
        validate: {
            validator: function(v) {
                return v.length > 1;
            },
            message: '{VALUE} must have length atleast 2'
        },
        required: true
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
     * @description a time when an SMS sent to gateway
     * @type {Object}
     */
    sentAt: {
        type: Date
    },


    /**
     * @name error
     * @description collect SMS sent error
     * @type {Object}
     */
    error: {
        type: Mixed
    },


    /**
     * @name options
     * @description SMS send options
     * @type {Object}
     */
    options: {
        type: Mixed
    }
};


//merge additional fields
var definition = _.merge({}, schemaFields, _config.models.sms.fields);


//sms schema
var SMSSchema = new Schema(definition);


//-----------------------------------------------------
// hooks
//-----------------------------------------------------
SMSSchema.pre('validate', function(next) {
    //TODO calculate callback details
    next();

});


//-----------------------------------------------------
// instance methods
//-----------------------------------------------------

SMSSchema.methods.toFeaturedSMS = function(done) {
    var featuredSMS = {};

    //set bulkId
    featuredSMS.bulkId = this._id;

    //prepare message details
    var message = {};
    message.text = this.text;
    message.intermediateReport = _config.intermediateReport;
    //deduce callback notify url of the message
    message.notifyUrl = [
        _config.callback.baseUrl,
        _config.callback.deliveries,
        '?_method=PUT',
        '&source=', this._id
    ].join('');
    message.notifyContentType = 'application/json';
    message.callbackData = this._id;

    //merge SMS send options
    message = _.merge({}, this.options);

    //load all unsent messages to be sent
    Message.find({
        sms: this._id,
        $or: [{ doneAt: null }, { error: { $ne: null } }]
    }, function(error, messages) {
        //backoff if error
        if (error) {
            done(error);
        }

        //continue build message details
        else {
            //prepared message destination details
            var destinations = _.map(messages, function(_message) {
                return _message.toSMSDestination();
            });
            destinations = _.compact(destinations);

            //set sms destination
            message.destinations = destinations;

            //set messages to send
            featuredSMS.messages = [message];

            done(null, featuredSMS);
        }
    });
};


/**
 * @function
 * @name send
 * @description send this sms
 * @param {Object} [options] featured SMS options
 * @param  {Function} done a callback to invoke on success or failure
 * @private
 */
SMSSchema.methods.send = function(done) {

    //reference
    var sms = this;

    //send featured sms
    async.waterfall([

        function getFeaturedSMS(next) {
            sms.toFeaturedSMS(next);
        },

        function sendSMS(featuredSMS, next) {

            smsTransport.sendFeaturedSMS(featuredSMS, function(error, response) {

                //compose error
                if (error) {
                    response = {
                        code: error.code,
                        message: error.message,
                        status: error.status
                    };
                }

                //pass error too
                next(null, response, error);

            });

        },

        function afterSend(response, error, next) {
            //process message response
            if (!response.code) {
                response = Utils.normalize(response);
                sms.sentAt = new Date();
            }

            //set sms send error
            else {
                sms.error = response;
            }

            //update sms
            sms.save(function(_error, _sms) {
                //fire original error
                if (error) {
                    next(error);
                }

                //continue
                else {
                    next(_error, _sms, response);
                }

            });
        },

        function updateSMSMessages(sms, responses, next) {

            Message.updateStatuses(responses, function(error, updates) {
                next(error, sms, updates);
            });

        }

    ], done);
};


//-----------------------------------------------------
// static methods
//-----------------------------------------------------

//expose Message as static properties
SMSSchema.statics.Message = Message;

/**
 * @name _send
 * @private
 */
SMSSchema.statics._send = function(sms, done) {

    //reference sms
    var SMS = this;

    async.waterfall([

        //persist sms
        function saveSMS(next) {
            SMS.create(sms, next);
        },

        function createMessages(_sms, next) {
            //prepare messages
            var messages = Message.prepare(_sms);

            //persist sms messages
            Message.create(messages, function(error, _messages) {
                next(error, _sms, _messages);
            });

        }

    ], done);

};


/**
 * @function
 * @name send
 * @param  {Object}   type featured SMS to send
 * @param  {Object}   additional featured SMS options 
 * @param  {Function} done a callback to invoke on success or failure
 * @return {SMS}          an instance of SMS sent
 * @public
 */
SMSSchema.statics.send = function(sms, options, done) {
    //normalize arguments
    if (options && _.isFunction(options)) {
        done = options;
        options = {};
    }

    //reference sms
    var SMS = this;

    //extend message with send options
    sms.options = options;

    SMS._send(sms, function(error, sms) {
        //notify creation error
        if (error) {
            done(error);
        }

        //send sms
        else {
            sms.send(done);
        }

    });

};


/**
 * @function
 * @name send
 * @param  {Object}   type featured SMS to send
 * @param  {Object}   additional featured SMS options 
 * @param  {Function} done a callback to invoke on success or failure
 * @return {SMS}          an instance of SMS sent
 * @public
 */
SMSSchema.statics.queue = function(sms, options, done) {
    //normalize arguments
    if (options && _.isFunction(options)) {
        done = options;
        options = {};
    }

    //reference sms
    var SMS = this;

    //extend message with send options
    sms.options = options;

    SMS._send(sms, function(error, _sms) {

        if (error) {
            //fire sms:queue:error event
            SMS.emit('sms:queue:error', error);
        } else {
            //fire sms:queue event
            SMS.emit('sms:queued', _sms);
        }

        //invoke callback if provided
        if (done && _.isFunction(done)) {
            done(error, _sms);
        }

    });

};


/**
 * @name unsent
 * @description obtain unsent sms
 * @public
 */
SMSSchema.statics.unsent = function(criteria, done) {

    //normalize arguments
    if (criteria && _.isFunction(criteria)) {
        done = criteria;
        criteria = {};
    }

    criteria = _.merge({}, {
        sentAt: null //ensure sms have not been sent
    }, criteria);

    //find unsent smss
    this.find(criteria, done);
};


/**
 * @function
 * @name resend
 * @description re-send all failed sms based on specified criteria
 * @param  {Function} done a callback to invoke on success or failure
 * @public
 */
SMSSchema.statics.resend = function(criteria, done) {
    //normalize arguments
    if (criteria && _.isFunction(criteria)) {
        done = criteria;
        criteria = {};
    }

    //reference SMS
    var SMS = this;

    //resend fail or unsent sms(s)
    async.waterfall([

        function findUnsentSMSs(next) {
            SMS.unsent(criteria, next);
        },

        function resendSMSs(unsents, next) {

            //check for unsent sms(s)
            if (unsents) {

                //prepare send work
                //TODO make use of multi process
                unsents = _.map(unsents, function(unsent) {
                    return function(_next) {
                        unsent.send(_next);
                    };
                });

                async.parallel(_.compact(unsents), next);

            } else {
                next(null, unsents);
            }
        }

    ], done);
};


/**
 * @function
 * @name resend
 * @description requeue all failed sms based on specified criteria
 * @param  {Function} done a callback to invoke on success or failure
 * @public
 */
SMSSchema.statics.requeue = function(criteria, done) {
    //normalize arguments
    if (criteria && _.isFunction(criteria)) {
        done = criteria;
        criteria = {};
    }

    //reference SMS
    var SMS = this;

    SMS.unsent(criteria, function(error, unsents) {

        if (error) {

            //fire sms:queue:error event
            SMS.emit('sms:queue:error', error);

        } else {

            //fire sms:queue event per sms
            _.forEach(unsents, function(unsent) {
                SMS.emit('sms:queued', unsent);
            });

        }

        //invoke callback if provided
        if (done && _.isFunction(done)) {
            done(error, unsents);
        }

    });

};


/**
 * @name sent
 * @description obtain sent sms with their messages
 * @param  {Object}   [criteria] valid mongoose query criteria
 * @param  {Function} done     a callback to invoke on success or error
 * @return {[type]}            
 */
SMSSchema.statics.sent = function(criteria, done) {
    
    //normalize arguments
    if (criteria && _.isFunction(criteria)) {
        done = criteria;
        criteria = {};
    }

    criteria = _.merge({}, {
        sentAt: { $ne: null } //ensure sms have been sent
    }, criteria);

    //find unsent smss
    this.find(criteria, done);

};


//-------------------------------------------------
// initialize & register SMS model
// ------------------------------------------------
var SMS;
var modelName = _config.models.sms.name;
try {
    if (!mongoose.model(modelName)) {
        SMS = mongoose.model(modelName, SMSSchema);
    } else {
        SMS = mongoose.model(modelName);
    }
} catch (e) {
    SMS = mongoose.model(modelName, SMSSchema);
}

//exports log schema
module.exports = SMS;