#!/usr/bin/env node

/**
 * M!service
 * RESTful JSON API for famous Man!ac Forum
 *
 * Copyright (c) 2014 Christopher Reitz
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

/**
 * Includes
 */
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');
var restify = require('restify');
var bunyan = require('bunyan');
var request = require('request');
var $ = require('cheerio');

/**
 * M!service server
 */
var mservice = {
	/**
	 * Default options
	 */
	options: {
		name: 'M!service',
		port: 8080,
		maniacUrl: 'https://maniac-forum.de/forum/pxmboard.php',
		ssl: {
			key: undefined,
			certificate: undefined,
		},
		log: {
			disabled: false,
			verbose: false,
			file: false
		},
		requestTimeout: 5000
	},
	/**
	 * Start server
	 */
	start: function (options) {
		mservice.options = mservice.utils.extend(mservice.options, options);
		var key = mservice.options.ssl.key;
		var certificate = mservice.options.ssl.certificate;

		var log;
		if ( ! mservice.options.log.disabled) {
			log = bunyan.createLogger({
				name: mservice.options.name,
				streams: [(mservice.options.log.file ? { path: mservice.options.log.file } : { stream: process.stdout })],
				serializers: bunyan.stdSerializers
			});
		}

		var server = restify.createServer({
			name: mservice.options.name,
			key: key ? fs.readFileSync(key) : key,
  			certificate: certificate ? fs.readFileSync(certificate) : certificate,
  			log: log
		});
		server.pre(restify.pre.sanitizePath());
		server.use(restify.bodyParser());
		server.use(restify.gzipResponse());
		server.on('uncaughtException', function(req, res, route, err) {
			if (log) {
				req.log.error({ req: req }, err.toString());
			}
			mservice.response.json(res, null, 'httpInternalServerError');
		});
		server.on('NotFound', function(req, res, next) {
			if (log && mservice.options.log.verbose) {
				req.log.warn({ req: req }, 'NotFound');
			}
			mservice.response.json(res, null, 'httpNotFound', next);
		});
		server.on('MethodNotAllowed', function(req, res, next) {
			if (log && mservice.options.log.verbose) {
				req.log.warn({ req: req }, 'MethodNotAllowed');
			}
			mservice.response.json(res, null, 'httpMethodNotAllowed', next);
		});
		server.on('after', function(req, res, next) {
			if (log && mservice.options.log.verbose) {
				req.log.info({ req: req }, 'REQUEST');
			}
		});

		// Dispatch routes
		var routes = mservice.routes;
		var routePrefix = 'mservice';
		for (var httpMethod in routes) {
			for (var route in routes[httpMethod]) {
				server[httpMethod](routePrefix + route, routes[httpMethod][route]);
			}
		}

		server.listen(mservice.options.port, function () {
			if (log) {
				log.info('Server started listening at ' + server.url);
			}
		});
	},
	/**
	 * Parser methods
	 */
	parse: {
		boards: function (html) {
			var boards = [];

			$(html).find('div table tr.bg2 td#norm:nth-child(2) a').each(function () {
				var $a = $(this);
				var href = $a.attr('href');
				var hrefSearch = '?mode=board&brdid=';
				if (href.indexOf(hrefSearch) != -1) {
					var board = {};
					board.id = mservice.utils.toInt(href.substring(href.indexOf(hrefSearch) + hrefSearch.length));
					board.name = $a.text();

					boards.push(board);
				}
			});

			return boards;
		},

		threads: function(html) {
			var threads = [];
			var threadEntries = html.split(/<\/*br>/);
			threadEntries.pop(); // Remove last (empty) entry

			// Compile Regexp outside loop to save perfomance
			var mainRegExp = /(.+)\s-\s(.+)\sam\s(.+)\(\s.+\s(\d+)\s(?:\|\s[A-Za-z:]+\s(.+)\s|)\)/;

			for (var i in threadEntries) {
				// fishing threadId from ld function call in onclick attribute
			  	var $messageHref = $('a', threadEntries[i]).first();
			  	var id = mservice.utils.toInt(/ld\((\w.+),0\)/.exec($messageHref.attr('onclick'))[1]);
			  	var messageId = mservice.utils.toInt(/(.+)msgid=(.+)/.exec($messageHref.attr('href'))[2]);

			  	var image = $('img', threadEntries[i]).attr('src').split('/').reverse()[0];
			  	// Sticky threads have pin image
			  	var sticky = image === 'fixed.gif';
				// Closed threads have lock image
			  	var closed = image === 'closed.gif';

			  	// Mods have are marked with the highlight css class
			  	var mod = $('span', threadEntries[i]).hasClass('highlight');

				// Fishing other thread data via easy regexp from line freed of html
				var subject, author, date, answerCount, answerDate;
		     	var regExpResult = mainRegExp.exec($(threadEntries[i]).text().trim().replace(/(\n|\t)/g, ''));

				if (regExpResult !== null) {
					subject 	= regExpResult[1];
					username  	= regExpResult[2];
					date 	    = mservice.utils.datetimeStringToISO8601(regExpResult[3]);
					answerCount = mservice.utils.toInt(regExpResult[4]);
					answerDate  = mservice.utils.datetimeStringToISO8601(regExpResult[5]);
				}

				// Add thread to list
				threads.push({
					id: id,
					messageId: messageId,
					sticky: sticky,
					closed: closed,
					username: username,
					mod: mod,
					subject: subject,
					date: date,
					answerCount: answerCount,
					answerDate: answerDate
				});
			}

			return threads;
		},

		thread: function(html) {
			var thread = [];
			var $htmlEntityDecodeHelper = $('<div/>');
			var parseThreadMessage = function ($li, level, $htmlEntityDecodeHelper) {
				var messageId = mservice.utils.toInt(/pxmboard.php\?mode=message&brdid=\d+&msgid=(\d+)/.exec($li.find('span a').attr('href'))[1]);
				var subject = $li.find('span a font').text();

				var userAndDateHtml = $li.find('span > font').html();
				var userAndDateRegExp = /<b>\n<span class="(.*)">\n(.+)\n<\/span>\n<\/b>\s-\s(.+)/;
				var userAndDateRegExpResult = userAndDateRegExp.exec(userAndDateHtml);
				var mod = userAndDateRegExpResult[1] === 'highlight';
				var username = $htmlEntityDecodeHelper.empty().append(userAndDateRegExpResult[2]).text();
				var date = mservice.utils.datetimeStringToISO8601(userAndDateRegExpResult[3]);

				return {
					messageId: messageId,
					level: level,
					subject: subject,
					mod: mod,
					username: username,
					date: date
				};
			}

			$(html).find('body > ul').each(function () {
				(function walkthrough($ul, level) {
					level = level || 0;
					$ul.children().each(function () {
						switch (this.name) {
							case 'li':
								thread.push(parseThreadMessage($(this), level, $htmlEntityDecodeHelper));
								break;
							case 'ul':
								walkthrough($(this), level + 1);
								break;
						}
					});
				})($(this));
			});

			return thread;
		},

		message: function(messageId, html) {
			var $html = $(html);

			var $bg1TRs  = $html.find('body table tr.bg1 td');
			var $userA   = $($bg1TRs.get(5)).find('a');

			var userId   = mservice.utils.toInt(/pxmboard.php\?mode=userprofile&brdid=\d+&usrid=(\d+)/.exec($userA.attr('href'))[1]);
			var username = $userA.html();
			var subject  = $($bg1TRs.get(2)).find('b').html();
			var date     = mservice.utils.datetimeStringToISO8601($($bg1TRs.get(7)).html());

			var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;

			var $text = $html.find('body table tr.bg2 td > font');
			var text = $text.text().trim();
			var textHtml = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

			$text.find('font[face="Courier New"] > a').replaceWith(mservice.utils.embedImages);
			var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

			return {
				messageId: mservice.utils.toInt(messageId),
				userId: userId,
				username: username,
				subject: subject,
				date: date,
				text: text,
				textHtml: textHtml,
				textHtmlWithImages: textHtmlWithEmbeddedImages
			};
		},

		preview: function(html) {
			var $html = $(html);

			var removeLinkBracesRegExp = /\[(<a.+>.+<\/a>)\]/g;

			var $text = $html.find('body table tr.bg2 td > font');
			var text = $text.text().trim();
			var textHtml = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

			$text.find('font[face="Courier New"] > a').replaceWith(mservice.utils.embedImages);
			var textHtmlWithEmbeddedImages = $text.html().replace(removeLinkBracesRegExp, '$1').trim();

			return {
				previewText: text,
				previewTextHtml: textHtml,
				previewTextHtmlWithImages: textHtmlWithEmbeddedImages
			};
		},

		quote: function (html) {
			var quote = $(html).find('textarea').text().trim();

			return {
				quote: quote
			}
		},

		user: function (userId, html) {
			var profile = {
				userId: undefined,
				username: undefined,
				picture: undefined,
				firstname: undefined,
				lastname: undefined,
				domicile: undefined,
				accountNo: undefined,
				registrationDate: undefined,
				email: undefined,
				icq: undefined,
				homepage: undefined,
				firstGame: undefined,
				allTimeClassics: undefined,
				favoriteGenres: undefined,
				currentSystems: undefined,
				hobbies: undefined,
				xboxLiveGamertag: undefined,
				psnId: undefined,
				nintendoFriendcode: undefined,
				lastUpdate: undefined
			};

			var $html = $(html);
			var data = [mservice.utils.toInt(userId)];

			var username = $html.find('#header').text().replace(/Userprofil für: /, '');
			data.push(username);

			var image = $html.find('tr.bg2 td img').first().attr('src');
			if (image != 'images/empty.gif') {
				data.push(mservice.options.maniacUrl.replace(/pxmboard.php/, '') + image);
			} else {
				data.push(null);
			}

			$html.find('tr.bg2').each(function (key, value) {
				data.push($($(this).find('td').get(1)).text().replace(/\n/g, '').trim());
			});

			var i = 0;
			for (var key in profile) {
				profile[key] = data[i++];
			}

			profile['registrationDate'] = mservice.utils.datetimeStringToISO8601(profile['registrationDate']);
			profile['lastUpdate'] = mservice.utils.datetimeStringToISO8601(profile['lastUpdate']);

			return profile;
		}
	},
	/**
	 * Response actions
	 */
	routes: {
		/**
		 * Actions callable by HTTP GET method
		 */
		get: {
			/**
			 * index action
			 */
			'/': function (req, res, next) {
				fs.readFile('doc/index.html', 'utf8', function (error, data) {
					if (error) {
				    	return console.log(error);
				  	}

				  	mservice.response.html(res, data, error, next);
				});
			},
			/**
			 * boards action
			 */
			'/boards': function (req, res, next) {
				var url = mservice.options.maniacUrl;
				mservice.request.get(res, next, url, function (html) {
					var data = mservice.parse.boards(html);
					mservice.response.json(res, data, null, next);
				});
			},
			/**
			 * threads action
			 */
			'/board/:boardId/threads': function (req, res, next) {
				var boardId  = req.params.boardId;
				var url = mservice.options.maniacUrl + '?mode=threadlist&brdid=' + boardId;

				mservice.request.get(res, next, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						error = 'boardId';
					} else {
						data = mservice.parse.threads($html.find('body p').html());
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * thread action
			 */
			 '/board/:boardId/thread/:threadId': function (req, res, next) {
			 	var boardId  = req.params.boardId;
				var threadId = req.params.threadId;
				var url = mservice.options.maniacUrl + '?mode=thread&brdid=' + boardId + '&thrdid=' + threadId;

				mservice.request.get(res, next, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						error = 'boardId';
					} else if ($html.find('body > ul').length === 0) { // unknown threadId returns empty page
						error = 'threadId';
					} else {
						data = mservice.parse.thread(html);
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * message action
			 */
			'/board/:boardId/message/:messageId': function (req, res, next) {
				var boardId   = req.params.boardId;
				var messageId = req.params.messageId;
				var url = mservice.options.maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

				mservice.request.get(res, next, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					} else {
						data = mservice.parse.message(messageId, html);
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * quote action, fetches quoted text of a man!ac message
			 */
			'/board/:boardId/quote/:messageId': function (req, res, next) {
				var boardId   = req.params.boardId;
				var messageId = req.params.messageId;
				var url = mservice.options.maniacUrl + '?mode=messageform&brdid=' + boardId + '&msgid=' + messageId;

				mservice.request.get(res, next, url, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					var title = $html.find('title').text();

					if (title === mservice.errors.maniacBoardTitles.error) {
						var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					} else {
						data = mservice.parse.quote(html);
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * User action, fetches data of a of a man!ac user profile
			 */
			'/user/:userId': function (req, res, next) {
				var userId = req.params.userId;
				var url = mservice.options.maniacUrl + '?mode=userprofile&usrid=' + userId;

				mservice.request.get(res, next, url, function (html) {
					var data = null;
					var error = null;

					var title = $(html).find('title').text();
					if (title === mservice.errors.maniacBoardTitles.error) {
						error = 'userId';
					} else {
						data = mservice.parse.user(userId, html);
					}

					mservice.response.json(res, data, error, next);
				});
			}
		},
		/**
		 * Routes for HTTP POST method
		 */
		post: {
			/**
			 * test-login action, checks if given username and password combination is accepted by the forum
			 */
			'/test-login': function (req, res, next) {
				var onSuccess = function () {
					var data = {
						success: true
					};
					mservice.response.json(res, data, null, next);
				};
				var onError = function () {
					var data = {
						success: false
					};
					mservice.response.json(res, data, null, next);
				};
				mservice.request.authenticate(req, res, next, onSuccess, onError);
			},
			/**
			 * Preview action
			 */
			'/board/:boardId/message/preview': function (req, res, next) {
				var options = {
					form: {
						mode: 'messagesave',
						brdid: req.params.boardId,
						body: req.params.text,
						preview_x: 'preview'
					}
				};

				mservice.request.post(res, next, options, function (html) {
					var data = null;
					var error = null;

					var $html = $(html);
					if ($html.find('title').text() !== mservice.errors.maniacBoardTitles.reply) {
						var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					} else {
						data = mservice.parse.preview(html);
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * Creates a thread to given boardId
			 */
			'/board/:boardId/message': function (req, res, next) {
				var options = {
					form: {
						mode: 'messagesave',
						brdid: req.params.boardId,
						nick: req.params.username,
						pass: req.params.password,
						subject: req.params.subject,
						body: req.params.text,
						notification: req.params.notification
					}
				};

				mservice.request.post(res, next, options, function (html) {
					var data = {
						success: true
					}
					var error = null;

					var $html = $(html);
					if ($html.find('title').text() !== mservice.errors.maniacBoardTitles.confirm) {
						data.success = false;
						var maniacErrorMessage = $($html.find('tr.bg1 td').get(2)).text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * Creates a reply to messageId
			 */
			'/board/:boardId/message/:messageId': function (req, res, next) {
				var options = {
					form: {
						mode: 'messagesave',
						brdid: req.params.boardId,
						msgid: req.params.messageId,
						nick: req.params.username,
						pass: req.params.password,
						subject: req.params.subject,
						body: req.params.text,
						notification: req.params.notification
					}
				};

				mservice.request.post(res, next, options, function (html) {
					var data = {
						success: true
					}
					var error = null;

					var $html = $(html);
					if ($html.find('title').text() !== mservice.errors.maniacBoardTitles.confirm) {
						data.success = false;
						var maniacErrorMessage = $($html.find('tr.bg1 td').get(2)).text();
						error = mservice.errors.maniacMessages[maniacErrorMessage];
					}

					mservice.response.json(res, data, error, next);
				});
			},
			/**
			 * Checks if notification is activated for given messageId
			 */
			'/board/:boardId/notification-status/:messageId': function (req, res, next) {
				mservice.request.authenticate(req, res, next, function (jar) {
					var boardId   = req.params.boardId;
					var messageId = req.params.messageId;
					var url = mservice.options.maniacUrl + '?mode=message&brdid=' + boardId + '&msgid=' + messageId;

					var options = {
						uri: url,
						jar: jar
					};

					mservice.request.get(res, next, options, function (html) {
						var notificationLinkText = $(html).find('a[href^="pxmboard.php?mode=messagenotification"]').text().trim().split(' ')[1];
						var data = {
							notificationEnabled: notificationLinkText === 'deaktivieren'
						}

						mservice.response.json(res, data, null, next);
					});
				});
			},
			/**
			 * Toggles notication for given messageId
			 */
			'/board/:boardId/notification/:messageId': function (req, res, next) {
				mservice.request.authenticate(req, res, next, function (jar) {
					var boardId   = req.params.boardId;
					var messageId = req.params.messageId;
					var url = mservice.options.maniacUrl + '?mode=messagenotification&brdid=' + boardId + '&msgid=' + messageId;

					var options = {
						uri: url,
						jar: jar
					};

					mservice.request.get(res, next, options, function (html) {
						var data = {
							success: true
						}
						var error = null;

						var $html = $(html);
						var title = $html.find('title').text();

						if (title === mservice.errors.maniacBoardTitles.error) {
							data.success = false;
							var maniacErrorMessage = $html.find('tr.bg2 td').first().text();
							error = mservice.errors.maniacMessages[maniacErrorMessage];
						}

						mservice.response.json(res, data, error, next);
					});
				});
			},
			/**
			 * Search action, returns threadlist for given boardId matching given search phrase
			 */
			'/board/:boardId/search-threads': function (req, res, next) {
				var options = {
					uri: mservice.utils.domainFromUri(mservice.options.maniacUrl) + '/forum/include/Ajax/threadfilter.php',
					form: {
						boardid: req.params.boardId,
						phrase: req.params.phrase
					},
					headers: {
						'User-Agent': 'M!service',
			        	'X-Requested-With': 'XMLHttpRequest'
			    	}
				};

				mservice.request.post(res, next, options, function (html) {
					var data = mservice.parse.threads(html);
					mservice.response.json(res, data, null, next);
				});
			}
		},
		/**
		 * Routes for HTTP PUT method
		 */
		put: {
			/**
			 * Updates (edits) a message
			 */
			'/board/:boardId/message/:messageId': function (req, res, next) {
				mservice.request.authenticate(req, res, next, function (jar) {
					var options = {
						jar: jar,
						form: {
							mode: 'messageeditsave',
							brdid: req.params.boardId,
							msgid: req.params.messageId,
							subject: req.params.subject,
							body: req.params.text
						}
					};

					mservice.request.post(res, next, options, function (html) {
						var data = {
							success: true
						}
						var error = null;

						var $html = $(html);
						var title = $html.find('title').text();
						if (title != mservice.errors.maniacBoardTitles.confirm) {
							data.success = false;
							var maniacErrorMessage = null;
							if (title === mservice.errors.maniacBoardTitles.error) {
								maniacErrorMessage = $html.find('tr.bg2 td').first().text();
							} else if (title === mservice.errors.maniacBoardTitles.edit) {
								maniacErrorMessage = $($html.find('tr.bg1 td').get(1)).text();
							}
							error = maniacErrorMessage ? mservice.errors.maniacMessages[maniacErrorMessage] : 'unknown';
						}

						mservice.response.json(res, data, error, next);
					});
				});
			}
		}
	},
	/**
	 * Request wrapper
	 */
	request: {
		get: function (res, next, options, fn) {
			if ((typeof options === 'string')) {
				options = {
					uri: options
				};
			}

			options = mservice.utils.extend({
				method: 'GET',
				rejectUnauthorized: false,
				timeout: mservice.options.requestTimeout,
				gzip: true,
				headers: {
					'User-Agent': 'M!service',
					'accept-encoding' : 'gzip,deflate'
				}
			}, options);

			request(options, function (requestError, requestResponse, requestBody) {
				if (requestError || requestResponse.statusCode !== 200) {
					res.status(504);
					mservice.response.connectionError(res, next);
			  	} else if (typeof fn === 'function') {
		  			fn(requestBody);
			  	}
			})
		},
		post: function (res, next, options, fn) {
			options = mservice.utils.extend({
				uri: mservice.options.maniacUrl,
				method: 'POST',
				rejectUnauthorized: false,
				timeout: mservice.options.requestTimeout,
				gzip: true,
				headers: {
					'User-Agent': 'M!service',
					'accept-encoding' : 'gzip,deflate'
				}
			}, options);

			request(options, function (requestError, requestResponse, requestBody) {
				if (requestError || requestResponse.statusCode !== 200) {
					res.status(504);
					mservice.response.connectionError(res, next);
			  	} else if (typeof fn === 'function') {
		  			fn(requestBody, requestResponse);
			  	}
			})
		},
		authenticate: function (req, res, next, fnSuccess, fnError) {
			var options = {
				form: {
					mode: 'login',
					nick: req.params.username,
					pass: req.params.password
				}
			};

			mservice.request.post(res, next, options, function (html, response) {
				if ($(html).find('form').length > 0) {
					if (typeof fnError === 'function') {
						fnError();
					} else {
						mservice.response.json(res, null, 'login', next);
					}
				} else if (typeof fnSuccess === 'function') {
					var cookieString = response.headers['set-cookie'][0].split(';')[0];
					var cookie = request.cookie(cookieString);
			 		var jar = request.jar();
					jar.setCookie(cookie, mservice.options.maniacUrl);

		  			fnSuccess(jar);
			  	}
			});
		}
	},
	/**
	 * Client responses
	 */
	response: {
		connectionError: function (res, next) {
			mservice.response.json(res, null, 'connection', next);
		},
		json: function (res, data, error, next) {
			var status = 200;
			var reply  = data;

			if (error) {
				status = mservice.errors.codes[error];
				reply  = { error: mservice.errors.messages[error] };
			}

			res.status(status);
			res.contentType = 'application/json';
			res.charSet('utf-8');
			res.send(reply);
			// setTimeout(function () {	res.send(reply); }, 5000);

			if (typeof next === 'function') {
				next();
			}
		},
		html: function (res, html, error, next) {
			res.writeHead(200, {
				'Content-Length': Buffer.byteLength(html),
				'Content-Type': 'text/html'
			});
			res.write(html);
			res.end();
		}
	},
	/**
	 * Error table
	 */
	errors: {
		codes: {
			httpNotFound: 404,
			httpMethodNotAllowed: 405,
			httpInternalServerError: 500,
			unknown: 500,
			connection: 504,
			permission: 401,
			login: 401,
			boardId: 404,
			messageId: 404,
			subject: 400,
			answerExists: 409,
			threadClosed: 403,
			threadId: 404,
			userId: 404
		},
		messages: {
			httpNotFound: 'Not Found',
			httpMethodNotAllowed: 'Method Not Allowed',
			httpInternalServerError: 'Internal Server Error',
			unknown: 'An unknown error is occured',
			connection: 'Could not connect to maniac server',
			permission: 'Permission denied',
			login: 'Authentication failed',
			boardId: 'boardId not found',
			messageId: 'messageId not found',
			subject: 'Subject not filled',
			answerExists: 'This message was already answered',
			threadClosed: 'Thread is closed',
			threadId: 'threadId not found',
			userId: 'userId not found'
		},
		maniacMessages: {
			'Bitte geben sie ihren Nickname ein': 'login',
			'Passwort ungültig': 'login',
			'Sie sind nicht dazu berechtigt': 'permission',
			'konnte Daten nicht einfügen': 'unchanged',
			'Board id fehlt': 'boardId',
			'message id ungültig': 'messageId',
			'Thema fehlt': 'subject',
			'Auf diese Nachricht wurde bereits geantwortet': 'answerExists',
			'dieser Thread ist geschlossen': 'threadClosed'
		},
		maniacBoardTitles: {
			confirm: '-= board: confirm =-',
			reply: '-= board: reply =-',
			error: '-= board: error =-',
			edit: '-= board: edit =-'
		}
	},
	/**
	 * Helper functions
	 */
	utils: {
		domainFromUri: function (uri) {
			var parts = uri.split('/');
			return parts[0] + '//' + parts[2];
		},
		extend: function (a, b) {
		    for (var key in b) {
		        if (b.hasOwnProperty(key) && b[key] !== undefined) {
		            a[key] = b[key];
		        }
		    }

		    return a;
		},
		datetimeStringToISO8601: function (datetimeString) {
			if ( ! datetimeString) {
				return '';
			}

		    var dateArr = datetimeString.match(/(\d{2}).(\d{2}).(\d{2,4})\s(\d{2}):(\d{2})/);
		    var year = dateArr[3].length === 2 ? '20' + dateArr[3] : dateArr[3];
		    var month = dateArr[2] - 1;
		    var day = dateArr[1];
		    var hours = dateArr[4];
		    var minutes = dateArr[5];
		    var date = new Date(year, month, day, hours, minutes);
		    var tzo = - date.getTimezoneOffset();
		    var dif = tzo >= 0 ? '+' : '-';
		    var pad = function(num) {
		        norm = Math.abs(Math.floor(num));
		        return (norm < 10 ? '0' : '') + norm;
		    };

		    return date.getFullYear()
		        + '-' + pad(date.getMonth() + 1)
		        + '-' + pad(date.getDate())
		        + 'T' + pad(date.getHours())
		        + ':' + pad(date.getMinutes())
		        + ':' + pad(date.getSeconds())
		        + dif + pad(tzo / 60)
		        + ':' + pad(tzo % 60)
		    ;
		},
		embedImages: function () {
			var replacement;
			var href = $(this).attr('href');

			if (href.match(/.+\.(jpg|jpeg|gif|png)$/) !== null) {
				replacement = '<a href="' + href + '"><img src="' + href + '"/></a>';
			} else {
				replacement = '<a href="' + href + '">' + href + '</a>';
			}

			return replacement;
		},
		now: function () {
			var now = new Date();

			var dd = now.getDate();
			if (dd < 10) {
			    dd = '0' + dd;
			}

			var mm = now.getMonth() + 1; // January is 0
			if (mm < 10) {
			    mm = '0' + mm;
			}

			var yyyy = now.getFullYear();

			var H = now.getHours();
			if (H < 10) {
				H = '0' + H;
			}

            var i = now.getMinutes();
        	if (i < 10) {
        		i = '0' + i;
        	}

            var s = now.getSeconds();
            if (s < 10) {
        		s = '0' + s;
        	}

			return yyyy + '-' + mm + '-' + dd + ' ' + H + ':' + i + ':' + s;
		},
		toInt: function (string) {
			return parseInt(string, 10);
		}
	},

	argv: function () {
		var argError = function (msg) {
			throw '\033[31mERROR: \033[0m' + msg;
		}

		var checkSSLKeyAndCertificateArg = function (argv) {
			var error = null;
			var key = argv['key'] ? argv['key'] : '';
			var certificate = argv['certificate'] ? argv['certificate'] : '';

			if (key.length > 0 || certificate.length > 0) {
				if (key.length === 0 || certificate.length === 0) {
					argError('To start server in SSL mode both key and certificate are required');
				} else if ( ! fs.existsSync(key)) {
					argError('Could not read ssl key: ' + key);
				} else if ( ! fs.existsSync(certificate)) {
					argError('Could not read ssl certificate: ' + certificate);
				}
			}
		};

		var checkLogFileArg = function (argv) {
			var error = null;
			var logFile = argv['logFile'] ? argv['logFile'] : false;
			var disableLogging = argv['disableLogging'];

			var fileIsWriteable = function (file) {
				var isWriteable = true;
				var fd;

				try {
				    fd = fs.openSync(file, 'a+', 0660);
				} catch(err) {
				    isWriteable = false;
				}

				if (fd) {
			    	fs.closeSync(fd);
			    }

				return isWriteable;
			};

			if ( ! disableLogging && logFile && ! fileIsWriteable(logFile)) {
				argError('Could not write to log file: ' + logFile + '. Make sure directory exists and verify permissions.');
			}
		};

		return yargs
			.strict()
		    .usage('M!service Server')
		    .example('$0', 'Starts server')
		    .example('$0 -k=/etc/ssl/localcerts/my.key -c=/etc/ssl/localcerts/my.crt', 'Starts server in SSL mode')
		    .example('$0 -l=/var/log/mservice/mservice.log', 'Starts server with log file')
		    .example('$0 --verbose-logging | mservice/node_modules/bunyan/bin/bunyan', 'Starts server for development')
		    .help('h', 'Displays this help message')
		    	.alias('h', 'help')
		    .alias('p', 'port')
		    	.describe('p', 'TCP port')
		    	.default('p', mservice.options.port)
		    .alias('u', 'maniac-url')
		    	.describe('u', 'URL to maniac-forum')
		    	.default('u', mservice.options.maniacUrl)
		    .alias('k', 'key')
		    	.describe('k', 'Path to ssl key')
		    	.check(checkSSLKeyAndCertificateArg)
		    .alias('c', 'certificate')
		    	.describe('c', 'Path to ssl certificate')
		    	.check(checkSSLKeyAndCertificateArg)
		    .describe('log-file', 'Output file for log (If false, output goes to stdout)')
		    	.default('log-file', mservice.options.log.file)
		    	.check(checkLogFileArg)
		    .boolean('disable-logging')
		    	.describe('disable-logging', 'Disables logging')
		    	.default('disable-logging', mservice.options.log.disabled)
		    .boolean('verbose-logging')
		    	.describe('verbose-logging', 'If enabled all requests are logged (useful for development)')
		    	.default('verbose-logging', mservice.options.log.verbose)
		    .requiresArg(['p', 'u', 'k', 'c'])
		    .argv
	}
};

/**
 * Start server with options from command line
 */
var argv = mservice.argv();

mservice.start({
	port: argv.port,
	maniacUrl: argv.maniacUrl,
	ssl: {
		key: argv.key,
		certificate: argv.certificate
	},
	log: {
		disabled: argv.disableLogging,
		verbose: argv.verboseLogging,
		file: argv.logFile
	}
});
