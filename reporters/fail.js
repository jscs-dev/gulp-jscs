'use strict';
var PluginError = require('gulp-util').PluginError;
var through = require('through2');

module.exports = function (opts) {
	opts = opts || {};

	// @type false|[]paths - paths to files that failed JSCS
	var fails = false;

	// @type false|[]files - files that need to be passed downstream on flush
	var buffer = opts.buffer !== false ? [] : false;

	return through.obj(function (file, enc, cb) {
		// check for failure
		if (file.jscs && !file.jscs.success) {
			(fails = fails || []).push(file.path);
		}

		// buffer or pass downstream
		(buffer || this).push(file);
		cb();
	}, function (cb) {
		if (fails) {
			this.emit('error', new PluginError('gulp-jscs', {
				message: 'JSCS failed for: ' + fails.join(', '),
				showStack: false
			}));
		}

		if (buffer) {
			// send the buffered files downstream
			buffer.forEach(function (file) {
				this.push(file);
			}, this);
		}

		cb();
	});
};
