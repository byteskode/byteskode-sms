'use strict';

/**
 * @name byteskode-sms
 * @description byteskode infobip sms with mongoose persistence support
 * @singleton
 */

//set environment to development by default
if (!(process.env || {}).NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

//suppress configuration warning
process.env.SUPPRESS_NO_CONFIG_WARNING = true;

//dependencies
var path = require('path');
var environment = require('execution-environment');

//configure execution-environment
if (!environment.isLocal) {
    environment.registerEnvironments({
        isLocal: ['test', 'dev', 'development']
    });
}


var SMS = require(path.join(__dirname, 'lib', 'sms'));


//export SMS model
module.exports = SMS;