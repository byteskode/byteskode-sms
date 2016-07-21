'use strict';


//dependencies
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/byteskode-sms');
var SMS = require('byteskode-sms');
var faker = require('faker');

//Alert!: Probably your should start push notification
//processing in your worker process
//and not main process
SMS.worker.start();

//listen for the worker queue events
SMS.worker.queue.on('job complete', function (id, result) {
  console.log('complete', id, result);
});

SMS.worker.queue.on('error', function (error) {
  console.log('error', error);
});

setInterval(function (argument) {

  //queue email for send
  SMS.queue({
    from: 'TEST',
    to: ['+255 716 000 000', '+255 685 111 111'],
    text: faker.lorem.sentence()
  });

}, 4000);