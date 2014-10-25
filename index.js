'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');

var fs = require('fs');
var path = require('path');

function stockReporter (errorCollection) {
	var out = [];
	errorCollection.forEach(function (errors) {
		errors.getErrorList().forEach(function (err) {
			out.push(errors.explainError(err, true) + '\n');
		});
	});

	if (out.length > 0) {
		this.emit('error', new gutil.PluginError('gulp-jscs', out.join('\n'), {
			showStack: false
		}));
	}
}

function getReporter (reporter) {
	if (typeof reporter === 'string') {
		var reporterPath = path.resolve(process.cwd(), reporter);

		if (!fs.existsSync(reporterPath)) {
			reporterPath = 'jscs/lib/reporters/' + reporter;
		}
		try {
			return require(reporterPath);
		} catch (e) {
			console.error('Reporter "%s" doesn\'t exist.', reporterPath);
			return;
		}
	}

	return typeof reporter === 'function' ?
			reporter :
			stockReporter;
}

module.exports = function (options, reporter) {
	var errorCollection = [];
	var checker = new Checker({esnext: options && !!options.esnext});

	checker.registerDefaultRules();

	if (typeof options === 'object') {
		delete options.esnext;
		checker.configure(options);
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
			cb(null, file);
			return;
		}

		try {
			var errors = checker.checkString(file.contents.toString(), file.relative);
			if (errors.getErrorCount() > 0) {
				errors.filePath = file.path;
				errorCollection.push(errors);
			}
		} catch (err) {
			console.error(err.message.replace('null:', file.relative + ':'));
		}

		cb(null, file);
	}, function (cb) {
		getReporter(reporter).call(this, errorCollection);

		cb();
	});
};
