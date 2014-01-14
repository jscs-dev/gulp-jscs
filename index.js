'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs/lib/checker');

module.exports = function (config) {
	var checker = new Checker();
	checker.registerDefaultRules();
	checker.configure(require(config ? config : path.join(process.cwd(), '.jscs.json')));

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-jscs', 'Streaming not supported'));
			return cb();
		}

		var errors = checker.checkString(file.contents.toString(), path.basename(file.path));
		var errorList = errors.getErrorList();

		var out = errorList.map(function (err) {
			return errors.explainError(err);
		}).join('\n\n');

		if (errorList.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-jscs', out));
			return cb();
		}

		this.push(file);
		cb();
	});
};
