#!/usr/bin/env node
/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var argv = require('./argv.js');
var server = require('./app/server.js');

var mservice = server();
mservice.run(argv(mservice.defaultOptions));
