#!/usr/bin/env node
/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var argv = require('./argv.js');
var server = require('./server.js');

var mservice = server();
mservice.run(argv(mservice.defaultOptions));
