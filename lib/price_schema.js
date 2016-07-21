'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//price schema type
var PriceSchema = new Schema({
  /**
   * @name pricePerMessage
   * @description amount charged per sent sms
   * @type {Object}
   */
  pricePerMessage: {
    type: Number
  },


  /**
   * @name currency
   * @description currency used for pricing
   * @type {Object}
   */
  currency: {
    type: String
  }

});

module.exports = PriceSchema;