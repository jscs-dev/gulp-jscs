'use strict';
var path = require('path');
var es = require('event-stream');
var gutil = require('gulp-util');
var Checker = require('jscs/lib/checker');

module.exports = function (configDir) {
	var gulpfileDir = path.dirname(module.parent.filename);
	var config = require(path.join(gulpfileDir, configDir ? configDir : '', '.jscs.json'));
	var checker = new Checker();

	checker.registerDefaultRules();
	checker.configure(config);

	return es.map(function (file, cb) {
		var errors = checker.checkString(file.contents.toString(), path.basename(file.path));
		var errorList = errors.getErrorList();

		var out = errorList.map(function (err) {
			return errors.explainError(err);
		}).join('\n\n');

		if (errorList.length > 0) {
			gutil.log('gulp-jscs:\n' + out + '\n');
		}

		cb(null, file);
	});
};
