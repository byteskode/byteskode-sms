'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//destination schema type
var DestinationSchema = new Schema({

    /**
     * @name country
     * @description a county where message is destined
     * @type {Object}
     */
    country: {
        type: String,
        required: true
    },


    /**
     * @name code
     * @description a county code where message is destined
     * @type {Object}
     */
    code: {
        type: String,
        required: true
    },


    /**
     * @name e164
     * @description e164 format of the receiver number
     * @type {Object}
     */
    to: {
        type: String,
        required: true
    }

});

module.exports = DestinationSchema;