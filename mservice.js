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
 * gets man!ac ressorce with given action
 */
var fetchManiacHtml = function(url, fn) {
	http.get(url, function(response) {
		//console.log(response);
		var html = [];

		response.on('data', function (chunk) {
			html.push(chunk);
			//console.log("" + chunk);
		});

		// when respond ends execute action 
		response.on('end', function () {
			fn(html.join());
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});  	

};


/**
 * cleans parsed stuff from ugly characters
 */
var cleanManiacStuff = function(text) {
	return text.replace(/[\t\r\n]/g, '').replace(/^\s+|\s+$/g, '');
};

/**
 * Response actions
 */
var actions = {
	/**
	 * index action, fetches man!ac board list
	 */
	index: {
	 	'route': '/', 
	 	'response': function (req, res, next) {
			fetchManiacHtml(maniacUrl, function (html) {
				var boardList = [];

				$(html).find('div table tr.bg2 td#norm:nth-child(2) a').each(function () {
					var $a = $(this);
					var href = $a.attr('href');
					var hrefSearch = '?mode=board&brdid=';
					if (href.indexOf(hrefSearch) != -1) {
						var board = {};			
						board.id = href.substring(href.indexOf(hrefSearch) + hrefSearch.length);
						board.text = $a.html();

						boardList.push(board);			
					}
				});

				//console.log(boardList);

				res.contentType = 'application/json';
				res.send(boardList);				
			});
		}
	},

	/**
	 * threadlist action, fetches a man!ac thread list
	 */
	threadlist: {
	 	'route': '/threadlist/:brdid', 
	 	'response': function (req, res, next) {
			var brdid = req.params.brdid;
			var url = maniacUrl + '?mode=threadlist&brdid=' + brdid;

			fetchManiacHtml(url, function (html) {
				var threadList = [];
				var threads = $(html).find('body p').html().split('<br/>');

				for(var i in threads) {
					// Ignore empty lines TODO
					if (threads[i].length < 500)  {
						continue;
					}

					var $thread = $(threads[i]);
					var $threadData = $thread.text().split("\n\r")

					// threads id
					var id = '';
					var url = $($thread.find('a').get(1)).attr('href');
					if (url !== undefined) {
					  	id = url.substring(41)
					}
					
					// threads subject
					var subject = cleanManiacStuff($threadData[0]);
					subject = subject.substring(0, subject.length - 2);
					
					// threads subject
					var author = '';
					if ($threadData[1] !== undefined) {
						author = cleanManiacStuff($threadData[1]);
					}
					
					// threads date
					var date = ''; 
					
					// threads answer count 
					var answerCount = ''; 

					// threads date of last answer
					var answerDate  = '';
					if ($threadData[2] !== undefined) {
						date        = cleanManiacStuff($threadData[2]).substring(3, 17);
						answerCount = cleanManiacStuff($threadData[2]).substring(30, 35).replace(/\D/g, '');
						answerDate  = cleanManiacStuff($threadData[2]).substring(42, 60);
					}

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

				//console.log(threadList);

				res.contentType = 'application/json';
				res.send(threadList);				
			});
		}
	},

	/**
	 * thread action, fetches a man!ac message list
	 */
	 thread: {
	 	'route': '/thread:thrdid', 
	 	'response': function (req, res, next) {
			var thrdid = req.params.thrdid;
			var url = maniacUrl + '?mode=thread&brdid=6&thrdid=' + thrdid;
			
			fetchManiacHtml(url, function (html) {
				var thread = [];
				var parent = null;

				$(html).find('body ul').each(function () {
					var message = {};
					var $message = $(this);

					console.log("------------------------------------------------------------------------------------");
					console.log($message.html());

					//console.log($message.html());

					message.id = $message.find('span a').attr('href').substring(40);

					message.parent = parent !== null ? parent.id : ''; 

					message.author = cleanManiacStuff($message.find('span font b span').html());
						
					message.subject = $message.find('span a font').html();

					// if (parent !== null) {
					// 	message.parent_subject = parent.subject;
					// }

					var date = $($message.find('span font').get(1)).html();
					message.date = date.substring(date.length - 14);
				 	
					// adding message to thread
					thread.push(message);

					// assign message as parent for next message
					parent = message;
				});

				
				console.log(thread);

				res.contentType = 'application/json';				
				res.send(thread);
				
			});
		}
	},

	/**
	 * message action, fetches a man!ac message
	 */
	message: {
	 	'route': '/message/:msgid', 
	 	'response': function (req, res, next) {
			var id = req.params.msgid;
			var url = maniacUrl + '?mode=message&brdid=6&msgid=' + id;
			
			fetchManiacHtml(url, function (html) {
				var $html = $(html);

				var message = {
					id: id,
					author: $($html.find('body table tr.bg1 td').get(5)).find('a').html(),
					subject: $($html.find('body table tr.bg1 td').get(2)).find('b').html(),
					date: $($html.find('body table tr.bg1 td').get(7)).html(),
					text: cleanManiacStuff($html.find('body table tr.bg2 td font').html())
				};

				//console.log(message);
				

				res.contentType = 'application/json';
				res.send(message);
			});

			return next();
		}	
	}
}


// start restify server
var server = restify.createServer();

var dispatcher = function(server, actions) {
	for (var name in actions) {
	var action  = actions[name];
	server.get(action.route, action.response);	
}

dispatcher(server, actions);


server.listen(8000);