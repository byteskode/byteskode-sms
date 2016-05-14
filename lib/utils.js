'use strict';


//dependencies
var _ = require('lodash');
var moment = require('moment');

/**
 * @description normalize SMS send response and deliveries report
 * @param  {Object} response  valid SMS send response or delivery report
 * @return {Object}           
 */
exports.normalize = function(response) {

    if (response.results || response.messages) {
        var messages = response.results || response.messages;

        response.results = _.map(messages, function(message) {

            delete message.bulkId;

            //set message _id
            if (message.messageId) {
                message._id = message.messageId;
            }

            if (!message._id && message.callbackData) {
                message._id = message.callbackData;
            }

            delete message.messageId;
            delete message.callbackData;

            //set message count
            if (message.smsCount) {
                message.count = message.smsCount;
            }

            delete message.smsCount;

            //parse dates
            if (message.sentAt) {
                message.sentAt = moment(message.sentAt).toDate();
            }

            if (message.doneAt) {
                message.doneAt = moment(message.doneAt).toDate();
            }

            //normalize status
            if (message.status) {
                //normalize id
                message.status.eid = message.status.id;
                delete message.status.id;

                //normalize group;
                message.status.group = {
                    eid: message.status.groupId,
                    name: message.status.groupName
                };

                delete message.status.groupId;
                delete message.status.groupName;
            }

            //normalize error
            if (message.error) {
                //normalize id
                message.error.eid = message.error.id;
                delete message.error.id;

                //normalize group;
                message.error.group = {
                    eid: message.error.groupId,
                    name: message.error.groupName
                };

                delete message.error.groupId;
                delete message.error.groupName;
            }

            delete message.to;

            return message;
        });
    }

    return response.results;
};