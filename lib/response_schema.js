'use strict';

/**
 * @name Response
 * @description mongoose schema to manage error and status of sent message
 * @see {@link Message}
 */

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//response group schema
var GroupSchema = new Schema({

    /**
     * @name eid
     * @description external id of the response group
     * @type {Object}
     */
    eid: {
        type: Number
    },


    /**
     * @name name
     * @description name of the response group
     * @type {Object}
     */
    name: {
        type: String
    }

});

//response schema type
var ResponseSchema = new Schema({

    /**
     * @name group
     * @description response group
     * @type {[type]}
     */
    group: GroupSchema,

    /**
     * @name eid
     * @description external id of the response
     * @type {Object}
     */
    eid: {
        type: Number
    },


    /**
     * @name name
     * @description name of the response
     * @type {Object}
     */
    name: {
        type: String
    },

    
    /**
     * @name description
     * @description description of the response
     * @type {Object}
     */
    description: {
        type: String
    },

    
    /**
     * @name permanent
     * @description tell whether the response is permanent
     * @type {Object}
     */
    permanent: {
        type: Boolean
    }

});

module.exports = ResponseSchema;