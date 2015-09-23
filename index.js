'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');
var assign = require('object-assign');
var tildify = require('tildify');

module.exports = function (options) {
	if (typeof options === 'string') {
		options = {configPath: options};
	}

	options = assign({esnext: false}, options);

	var checker = new Checker({esnext: Boolean(options.esnext)});

	checker.registerDefaultRules();

	var configPath = options.configPath;
	var shouldFix = options.fix;

	delete options.esnext;
	delete options.configPath;
	delete options.fix;

	if (configPath) {
		if (typeof options === 'object' && Object.keys(options).length) {
			throw new Error('configPath option is not compatible with code style options');
		}

		try {
			checker.configure(loadConfigFile.load(configPath));
		} catch (err) {
			err.message = 'Unable to load JSCS config file at ' + tildify(path.resolve(configPath)) + '\n' + err.message;
			throw err;
		}
	} else if (JSON.stringify(options) !== '{}') {
		checker.configure(options);
	} else {
		checker.configure(loadConfigFile.load());
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

		if (checker.getConfiguration().isFileExcluded(file.path)) {
			cb(null, file);
			return;
		}

		var fixResults;
		var errors;
		var contents = file.contents.toString();

		if (shouldFix) {
			fixResults = checker.fixString(contents, file.relative);
			errors = fixResults.errors;
			file.contents = new Buffer(fixResults.output);
		} else {
			errors = checker.checkString(contents, file.relative);
		}

		var errorList = errors.getErrorList();

		file.jscs = {
			success: true,
			errorCount: 0,
			errors: []
		};

		if (errorList.length > 0) {
			file.jscs.success = false;
			file.jscs.errorCount = errorList.length;
			file.jscs.errors = errors;
		}

		cb(null, file);
	});
};

module.exports.reporter = require('./reporters');
