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

describe('loginScraper', function() {
    it('it should parse html and return login status = false when user is not logged in', function(done) {
        loadHtmlRessource('boardList', function (error, html) {
            expect(error).to.be.null;

            var login = scrapers.login(html);                
            expect(login).to.be.false;

            done();            
        });
    });
    
    it('it should parse html and return login status = true when user is logged in', function(done) {
        loadHtmlRessource('boardListLoggedIn', function (error, html) {
            expect(error).to.be.null;

            var login = scrapers.login(html);                
            expect(login).to.be.true;

            done();            
        });
    });
});
