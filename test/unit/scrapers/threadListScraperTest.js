/**
 * M!service
 * Copyright(c) 2014-2017 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var helpers = require('./../../helpers.js');
var scrapers = helpers.scrapers;
var loadHtmlRessource = helpers.loadHtmlRessource;
var loadJsonRessource = helpers.loadJsonRessource;

describe('thradListScraper', function() {
    it('it should parse html and return an array of threads', function(done) {
        loadHtmlRessource('threadList', function(errorHtml, html) {
            loadJsonRessource('threadList', function(errorJson, json) {
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var boardId = 6;
                var threadList = scrapers.threadList(html, boardId);
                expect(threadList).to.eql(JSON.parse(json));

                done();
            });
        });
    });
});