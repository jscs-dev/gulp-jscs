'use strict';
var getReporter = require('jscs/lib/cli-config').getReporter;
var PluginError = require('gulp-util').PluginError;
var through = require('through2');

exports.failReporter = require('./fail');

exports.loadReporter = function (reporter) {
	// we want the function
	if (typeof reporter === 'function') return reporter;

	// object reporters
	if (typeof reporter === 'object' && typeof reporter.reporter === 'function') return reporter.reporter;

	// load JSCS built-in or full-path or module reporters
	if (typeof reporter === 'string' || !reporter) {
		try {
			return getReporter(reporter).writer;
		} catch (err) {}
	}
};

exports.reporter = function (reporter, reporterCfg) {
	reporterCfg = reporterCfg || {};

	if (reporter === 'fail') {
		return exports.failReporter(reporterCfg);
	}

	var rpt = exports.loadReporter(reporter);

	if (typeof rpt !== 'function') {
		throw new PluginError('gulp-jscs', 'Invalid reporter');
	}

	// return stream that reports stuff
	return through.obj(function (file, enc, cb) {
		if (file.jscs && !file.jscs.success) {
			rpt([file.jscs.errors]);
		}

		cb(null, file);
	});
};
