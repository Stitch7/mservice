/**
 * m!service
 * Copyright(c) 2014-2018 Christopher Reitz.
 * MIT Licensed
 */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var helpers = require('./../../helpers.js');
var scrapers = helpers.scrapers;
var loadHtmlRessource = helpers.loadHtmlRessource;
var loadJsonRessource = helpers.loadJsonRessource;

describe('userScraper', function() {
    it('it should parse html and return a user model', function(done) {
        loadHtmlRessource('user', function (errorHtml, html) {
            loadJsonRessource('user', function (errorJson, json) {
                expect(errorHtml).to.be.null;
                expect(errorJson).to.be.null;

                var maniacUrl = 'https://maniac-forum.de/forum/pxmboard.php';
                var userId = 2615;
                var user = scrapers.user(maniacUrl, userId, html);
                expect(user).to.eql(JSON.parse(json));

                done();
            });
        });
    });
});
