'use strict';
var PluginError = require('gulp-util').PluginError;
var through = require('through2');

module.exports = function () {
	// paths to files that failed JSCS
	var fails = false;

	return through.obj(function (file, enc, cb) {
		// check for failure
		if (file.jscs && !file.jscs.success) {
			(fails = fails || []).push(file.path);
		}

		this.push(file);
		cb();
	}, function (cb) {
		if (fails) {
			this.emit('error', new PluginError('gulp-jscs', {
				message: 'JSCS failed for: ' + fails.join(', '),
				showStack: false
			}));
		}

		cb();
	});
};
