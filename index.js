'use strict';
var path = require('path');
var es = require('event-stream');
var gutil = require('gulp-util');
var Checker = require('jscs/lib/checker');

module.exports = function (config) {
	var checker = new Checker();
	checker.registerDefaultRules();
	checker.configure(require(config ? config : path.join(process.cwd(), '.jscs.json')));

	return es.map(function (file, cb) {
		var errors = checker.checkString(file.contents.toString(), path.basename(file.path));
		var errorList = errors.getErrorList();

		var out = errorList.map(function (err) {
			return errors.explainError(err);
		}).join('\n\n');

		if (errorList.length > 0) {
			return cb(new Error('gulp-jscs:\n' + out + '\n'), file);
		}

		cb(null, file);
	});
};
