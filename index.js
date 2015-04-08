'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');
var assign = require('object-assign');
var tildify = require('tildify');

module.exports = function (options) {
	options = options || '.jscsrc';

	if (typeof options === 'string') {
		options = {configPath: options};
	}

	options = assign({esnext: false}, options);

	var out = [];
	var checker = new Checker({esnext: !!options.esnext});

	checker.registerDefaultRules();

	var configPath = options.configPath;
	delete options.esnext;
	delete options.configPath;

	if (configPath) {
		if (typeof options === 'object' && Object.keys(options).length) {
			throw new Error('configPath option is not compatible with code style options');
		}

		try {
			checker.configure(loadConfigFile.load(configPath));
		} catch (error) {
			throw new Error('Unable to load JSCS config file at ' + tildify(path.resolve(configPath)));
		}
	} else {
		checker.configure(options);
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

		try {
			var errors = checker.checkString(file.contents.toString(), file.relative);
			var errorList = errors.getErrorList();

			file.jscs = {
				success: true,
				errorCount: 0,
				errors: []
			};

			if (errorList.length > 0) {
				file.jscs.success = false;
				file.jscs.errorCount = errorList.length;
				file.jscs.errors = errorList;
			}

			errorList.forEach(function (err) {
				out.push(errors.explainError(err, true));
			});
		} catch (err) {
			out.push(err.stack.replace('null:', file.relative + ':'));
		}

		cb(null, file);
	}, function (cb) {
		if (out.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-jscs', out.join('\n\n'), {
				showStack: false
			}));
		}

		cb();
	});
};
