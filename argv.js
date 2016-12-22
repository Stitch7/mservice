/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var fs = require('fs');
var yargs = require('yargs');

module.exports = function (defaultOptions) {
    var argError = function (msg) {
        throw '\x1B[31mERROR: \x1B[0m' + msg;
    };

    var checkLogFileArg = function (argv) {
        var logFile = argv.logFile ? argv.logFile : false;
        var disableLogging = argv.disableLogging;

        var fileIsWriteable = function (file) {
            var isWriteable = true;
            var fd;

            try {
                fd = fs.openSync(file, 'a+', 432); // 0660
            } catch(err) {
                isWriteable = false;
            }

            if (fd) {
                fs.closeSync(fd);
            }

            return isWriteable;
        };

        if (!disableLogging && logFile && !fileIsWriteable(logFile)) {
            argError('Could not write to log file: ' + logFile + '. Make sure directory exists and verify permissions.');
        }

        return true;
    };

    return yargs
        .strict()
        .usage('M!service Server')
        .example('$0', 'Starts server')
        .example('$0 -l=/var/log/mservice/mservice.log', 'Starts server with log file')
        .example('$0 --verbose-logging | mservice/node_modules/bunyan/bin/bunyan -o short', 'Starts server for development')
        .help('h', 'Displays this help message')
            .alias('h', 'help')
        .alias('p', 'port')
            .describe('p', 'TCP port')
            .default('p', defaultOptions.port)
        .alias('u', 'maniac-url')
            .describe('u', 'URL to maniac-forum')
            .default('u', defaultOptions.maniacUrl)
        .alias('l', 'log-file')
            .describe('l', 'Output file for log (If false, output goes to stdout)')
            .default('l', defaultOptions.log.file)
            .check(checkLogFileArg)
        .boolean('disable-logging')
            .describe('disable-logging', 'Disables logging')
            .default('disable-logging', defaultOptions.log.disabled)
        .boolean('verbose-logging')
            .describe('verbose-logging', 'If enabled all requests are logged (useful for development)')
            .default('verbose-logging', defaultOptions.log.verbose)
        .requiresArg(['p', 'u'])
        .argv;
};
