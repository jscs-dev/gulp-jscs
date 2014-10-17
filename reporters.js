'use strict';
var PluginError = require('gulp-util').PluginError;
var through = require('through2');

var failReporter = function (errors) {
	if (errors.length) {
		var errorFiles = [];
		errors.forEach(function (error) {
			errorFiles.push(error.getFilename());
		});
		throw new PluginError('gulp-jscs', 'JSCS failed for: ' + errorFiles.join(', '));
	}
};

exports.loadReporter = function (reporter) {
	// we want the function
	if (typeof reporter === 'function') {
		return reporter;
	}

	// object reporters
	if (typeof reporter === 'object' && typeof reporter.reporter === 'function') {
		return reporter.reporter;
	}

	if (typeof reporter === 'string') {
		// load our own 'fail' reporter
		if (reporter === 'fail') {
			return failReporter;
		}

		// load jshint built-in reporters
		try {
			return exports.loadReporter(require('jscs/lib/reporters/' + reporter));
		} catch (err) {}

		// load full-path or module reporters
		try {
			return exports.loadReporter(require(reporter));
		} catch (err) {}
	}
};

exports.reporter = function (reporterName) {
	var errors = [];
	var exceptionFiles = [];
	var reporter = exports.loadReporter(reporterName || 'console');

	if (typeof reporter !== 'function') {
		throw new PluginError('gulp-jscs', 'Invalid reporter');
	}

	return through.obj(function (file, enc, cb) {
		if (file.jscs) {
			if (file.jscs.exception) {
				exceptionFiles.push([file]);
			}
			if (file.jscs.fails) {
				errors.push(file.jscs.fails);
			}
		}
		cb(null, file);
	}, function (cb) {
		if (exceptionFiles.length) {
			console.log('EXCEPTIONS:\n');
			exceptionFiles.forEach(function (file) {
				var message = file.jscs.exception.message;
				console.log(message.replace('null:', file.relative + ':'));
			});
			console.log('\n');
		}
		reporter(errors);
		cb();
	});
};
