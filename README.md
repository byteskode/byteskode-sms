byteskode-sms
=====================

[![Build Status](https://travis-ci.org/byteskode/byteskode-sms.svg?branch=master)](https://travis-ci.org/byteskode/byteskode-sms)

byteskode infobip sms with mongoose persistence support

*Note: sms is configured using [config](https://github.com/lorenwest/node-config) using key `sms`*

## Requirements
- [mongoose](https://github.com/Automattic/mongoose)
- [e164.js](https://github.com/pdeschen/e164.js)
- [phone](https://github.com/lykmapipo/phone)
- *All number to start with calling code*

## Installation
```sh
$ npm install --save mongoose byteskode-sms
```

## Usage

```javascript
var mongoose = require('mongoose');
var SMS = require('byteskode-sms');

//sms to send
var sms = {
    from: 'TEST',
    to: ['+255 716 000 000', '+255 685 111 111'],
    text: faker.lorem.sentence()
};

//send immediate
SMS.send(sms, [options], function(error, _sms, _messages){
        ...
});

//queue for later sending
//you will have to implement worker for later resend
SMS.on('sms:queued',function(sms){
    ...
    sms.send(done);
    ...
});
SMS.queue(sms);

//resend failed sms
SMS.resend(function(error, resents){
    ...
});

//obtain unsent sms
SMS.unsent([criteria], fuction(error,unsents){
    ...
});

//obtain sent sms
SMS.sent([criteria], fuction(error,unsents){
    ...
});

```

## Configuration Options
Base on your environment setup, ensure you have the following configurations in your `config` files.

```js
sms: {
        username: <infobip_usernam>,
        password: <infobip_password>,
        callback: {
            baseUrl:'http://example.com', //without leading foward slash
            deliveries: '/sms-deliveries',
        },
        intermediateReport:true,
        models: {
            sms: {
                name: 'SMS',
                // fields: {}
            },
            message: {
                name: 'SMSMessage',
                // fields:{}
            }
        }
    }
```

## TODOS
- [ ] add inbox sms to allow receiving sms
- [ ] add ability to obtain message based on status
    - [x] sent
    - [x] unsent
    - [ ] pending
    - [ ] delivered
    - [ ] failed

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```

* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## References
- [List_of_country_calling_codes](https://en.wikipedia.org/wiki/List_of_country_calling_codes)
- [https://dev.infobip.com/](https://dev.infobip.com/)

## Licence
The MIT License (MIT)

Copyright (c) 2015 byteskode & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 