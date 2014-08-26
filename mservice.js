#!/usr/bin/env node

/**
 * mService
 * net service for mClient, iPad client for famous man!ac forum
 *
 * Copyright (c) 2012 Christopher Reitz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// libraries
var sys = require('sys');
var http = require('http');

var restify = require('restify');
var $ = require('cheerio');

var maniacUrl = 'http://maniac-forum.de/forum/pxmboard.php';

/**
 * gets man!ac ressource with given action
 */
var fetchManiacHtml = function(url, fn) {
	http.get(url, function(response) {
		// console.log(response);
		var html = [];

		response.on('data', function (chunk) {
			html.push(chunk);
			//console.log("" + chunk);
		});

		// when respond ends execute action
		response.on('end', function () {
			fn(html.join(""));
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
};


/**
 * cleans parsed stuff from ugly characters
 */
var clean = function(text) {
	return text.replace(/[\t\r\n]/g, '').replace(/^\s+|\s+$/g, '');
};


/**
 * Response actions
 */
var actions = {
	/**
	 * index action, fetches man!ac board list
	 */
	'/': function (req, res, next) {
		fetchManiacHtml(maniacUrl, function (html) {
			var boardList = [];

			$(html).find('div table tr.bg2 td#norm:nth-child(2) a').each(function () {
				var $a = $(this);
				var href = $a.attr('href');
				var hrefSearch = '?mode=board&brdid=';
				if (href.indexOf(hrefSearch) != -1) {
					var board = {};
					board.id = href.substring(href.indexOf(hrefSearch) + hrefSearch.length);
					board.text = $a.text();

					boardList.push(board);
				}
			});

			//console.log(boardList);

			res.contentType = 'application/json';
			res.send(boardList);
		});
	},

	/**
	 * threadlist action, fetches a man!ac thread list
	 */
	'/threadlist/:brdid': function (req, res, next) {
		var brdid = req.params.brdid;
		var url = maniacUrl + '?mode=threadlist&brdid=' + brdid;

		fetchManiacHtml(url, function (html) {
			var threadList = [];
			var threads = $(html).find('body p').html().split('<br>');

			for(var i in threads) {
				// Ignore empty lines TODO
				if (threads[i].length < 500)  {
					continue;
				}

				var $thread = $(threads[i]);

				// fishing thread id
			  	/ld\((\w.+),(\w.+)\)/.exec($($thread.find('a').get(1)).attr('onclick'));
			  	var id = RegExp.$1;

				// fishing other thread data
				///\n\t\n\s(\w.+)\s-\s\n\n(\w.+)\n\n\sam\s(\w.+)\n\t\(\sAntworten:\s(\w.+)\s\|\sLetzte: (\w.+)\s\)/.exec($thread.text());
				/\n\t\n\s(.+)\s-\s\n\n(.+)\n\n\sam\s(.+)\n\t\(\sAntworten:\s(.+)\s\|\sLetzte: (.+)\s\)/.exec($thread.text());
				var subject 	= RegExp.$1;
				var author  	= RegExp.$2;
				var date 	    = RegExp.$3;
				var answerCount = RegExp.$4;
				var answerDate  = RegExp.$5;

				// adding thread to list
				threadList.push({
					id: id,
					author: author,
					subject: subject,
					date: date,
					answerCount: answerCount,
					answerDate: answerDate
				});
			}

			res.contentType = 'application/json';
			res.send(threadList);
		});
	},


	/**
	 * thread action, fetches a man!ac message list
	 */
	 '/thread/:thrdid': function (req, res, next) {
		var thrdid = req.params.thrdid;
		var url = maniacUrl + '?mode=thread&brdid=6&thrdid=' + thrdid;

		fetchManiacHtml(url, function (html) {
			var thread = [];

			$(html).find('body > ul').each(function () {
				var $thread = $(this);

				/*
				var intend = function (level) {
					var spaces = '';
					for (var i = 0; i <= level; i++) {
						spaces += '   ';
					}
					return spaces;
				};
				*/

				var createMessage = function ($li, level) {
					if ($li.find('span a').attr('href') === undefined) {
						console.log($li.html());
					}

					return message = {
						id: $li.find('span a').attr('href').substring(40),
						level: level,
						author: clean($li.find('span font b span').html()),
						subject: $li.find('span a font').text(),
						date: clean($li.find('span > font').html()).replace(/<(\w+)[^>]*>.*<\/\1> - /gi, '')
					};
				};

				var parse = function($ul, level) {
					level = level || 0;

					$ul.children().each(function () {
						switch (this.name) {
							case 'li':
								//console.log(intend(level) + '(' + level + ')  ' + $(this).find('span a font').html() + ' - ' + clean($(this).find('span font b span').html()));
								thread.push(createMessage($(this), level));
								break;

							case 'ul':
								parse($(this), level + 1);
								break;
						}
					});
				};

				parse($thread);
			});

			// console.log(thread);

			res.contentType = 'application/json';
			res.send(thread);

		});
	},

	/**
	 * message action, fetches a man!ac message
	 */
	'/message/:msgid': function (req, res, next) {
		var id = req.params.msgid;
		var url = maniacUrl + '?mode=message&brdid=6&msgid=' + id;

		fetchManiacHtml(url, function (html) {
			var $html = $(html);
			var message = {
				id: id,
				author: $($html.find('body table tr.bg1 td').get(5)).find('a').html(),
				subject: $($html.find('body table tr.bg1 td').get(2)).find('b').html(),
				date: $($html.find('body table tr.bg1 td').get(7)).html(),
				text: clean($html.find('body table tr.bg2 td font').html())
			};

			res.contentType = 'application/json';
			res.send(message);
		});

		return next();
	}
}

/**/
// start restify server
var server = restify.createServer();

var dispatcher = function(server, actions) {
	for (var route in actions) {
		server.get(route, actions[route]);
	}
};

dispatcher(server, actions);

server.listen(8000);
/**/

// actions['/thread/:thrdid']({params: {thrdid: 149506}})
actions['/threadlist/:brdid']({params: {brdid: 6}})
