'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');

module.exports = function (options) {
	var checker = new Checker({esnext: options && !!options.esnext});

	checker.registerDefaultRules();

	if (typeof options === 'object') {
		checker.configure(options);
		delete options.esnext;
	} else {
		checker.configure(loadConfigFile.load(options));
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-jscs', 'Streaming not supported'));
			return;
		}

		if (checker._isExcluded(file.path)) {
			file.jscs = {ignored: true};
			cb(null, file);
			return;
		}

		try {
			var errors = checker.checkString(file.contents.toString(), file.relative);
			if (errors.isEmpty()) {
				file.jscs = {success: true};
			} else {
				file.jscs = {fails: errors};
			}
		} catch (err) {
			file.jscs = {exception: err};
		}

		cb(null, file);
	});
};
