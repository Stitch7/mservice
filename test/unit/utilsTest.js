/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var helpers = require('./../helpers.js');
var utils = require('./../../app/utils.js');

describe('utils', function() {
    it('it should extend correct', function() {
        var options = utils.extend({ a: true }, { b: false });
        var result = { a: true, b: false };
        expect(options).to.eql(result);
    });

    it('it should format now correct', function() {
        expect(utils.now(new Date(1984, 6, 26, 1, 33, 7))).to.eql("1984-07-26 01:33:07");
    });
});
