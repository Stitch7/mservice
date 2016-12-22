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

describe('latestUserScraper', function() {
    it('it should parse html and return the latest user', function(done) {
        loadHtmlRessource('boardList', function (error, html) {
            var latestUser = scrapers.latestUser(html);

            expect(error).to.be.null;
            expect(latestUser).to.have.property('userId', 56065);
            expect(latestUser).to.have.property('username', 'Doktor_Dose');
            
            done();
        });        
    });
});
