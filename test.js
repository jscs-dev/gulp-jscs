/* eslint-env mocha */
'use strict';
var path = require('path');
var assert = require('assert');
var gutil = require('gulp-util');
var streamAssert = require('stream-assert');
var tempWrite = require('temp-write');
var jscs = require('./');

var stdoutWrite = process.stdout.write;
var stdoutStub;

function stubStdout() {
	stdoutStub = '';
	process.stdout.write = function (str) {
		stdoutStub += str;
	};
}

function teardown() {
	process.stdout.write = stdoutWrite;
}

// in case test fails due to timeout
afterEach(teardown);

it('should check code style of JS files', function (cb) {
	var stream = jscs();

	stream
		.pipe(streamAssert.first(function (file) {
			var errors = file.jscs.errors;
			assert(/Multiple var declaration/.test(errors.explainError(errors.getErrorList()[0], false)));
		}))
		.pipe(streamAssert.second(function (file) {
			var errors = file.jscs.errors;
			assert(/Illegal space before/.test(errors.explainError(errors.getErrorList()[1], false)));
		}))
		.pipe(streamAssert.end(cb));

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture.js'),
		contents: new Buffer('var x = 1,y = 2;')
	}));

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture2.js'),
		contents: new Buffer('var x = { a: 1 };')
	}));

	stream.end();
});

it('should check code style of JS files using a preset', function (cb) {
	var stream = jscs({
		configPath: tempWrite.sync(JSON.stringify({preset: 'google'}))
	});

	stream
		.pipe(streamAssert.first(function (file) {
			var errors = file.jscs.errors;
			assert(/Missing line feed at file end/.test(errors.explainError(errors.getErrorList()[1], false)));
		}))
		.pipe(streamAssert.end(cb));

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture.js'),
		contents: new Buffer('var x = 1,y = 2;')
	}));

	stream.end();
});

it('should pass valid files', function (cb) {
	var stream = jscs();

	stream.pipe(jscs.reporter('fail')).on('error', function (err) {
		assert(false, err);
	}).on('end', cb).resume();

	stream.write(new gutil.File({
		path: path.join(__dirname, 'fixture.js'),
		contents: new Buffer('var x = 1; var y = 2;')
	}));

	stream.end();
});

it('should respect "excludeFiles" from config', function (cb) {
	var stream = jscs();

	stream.pipe(jscs.reporter('fail')).on('error', function (err) {
		assert(false, err);
	}).on('end', cb).resume();

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'excluded.js'),
		contents: new Buffer('var x = { a: 1 };')
	}));

	stream.end();
});

it('should accept configPath options', function (cb) {
	var stream = jscs({
		configPath: '.jscsrc'
	});

	stream
		.pipe(streamAssert.first(function (file) {
			var errors = file.jscs.errors;
			var errorList = errors.getErrorList();
			assert(errorList.length === 1 && /Multiple var declaration/.test(errors.explainError(errorList[0], false)));
		}))
		.pipe(streamAssert.end(cb));

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture.js'),
		contents: new Buffer('import x from \'x\'; var x = 1, y = 2;')
	}));

	stream.end();
});

it('should accept the fix option', function (cb) {
	var stream = jscs({
		fix: true
	});

	stream.on('data', function (file) {
		assert.equal(file.contents.toString(), 'var x = {a: 1, b: 2}');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture.js'),
		contents: new Buffer('var x = { a: 1, b: 2 }')
	}));

	stream.end();
});

it('should run autofix over as many errors as possible', function (done) {
	var config = {
		maxErrors: 1,
		requireSpaceBeforeBinaryOperators: ['=']
	};
	var validJS = 'var foo =1;\nvar bar =2;';
	var invalidJS = 'var foo=1;\nvar bar=2;';

	var stream = jscs({
		fix: true,
		configPath: tempWrite.sync(JSON.stringify(config))
	});

	stream
		.pipe(streamAssert.first(function (file) {
			assert.equal(file.contents.toString(), validJS);
		}))
		.pipe(streamAssert.second(function (file) {
			assert.equal(file.contents.toString(), validJS);
		}))
		.pipe(streamAssert.end(done));

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture.js'),
		contents: new Buffer(invalidJS)
	}));

	stream.write(new gutil.File({
		base: __dirname,
		path: path.join(__dirname, 'fixture2.js'),
		contents: new Buffer(invalidJS)
	}));

	stream.end();
});

it('should not mutate the options object passed as argument', function () {
	var options = {foo: true};
	jscs(options);
	assert.equal(options.foo, true);
});

describe('Reporter', function () {
	it('`.reporter()` called with no arguments should use the default reporter', function (cb) {
		stubStdout();
		var stream = jscs();

		stream.pipe(jscs.reporter()).on('end', function () {
			assert(/Multiple var declaration[^]*---\^/.test(stdoutStub));
			teardown();
			cb();
		}).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'fixture.js'),
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});

	it('`.reporter()` called with a non-function argument should delegate reporter loading to JSCS', function (cb) {
		stubStdout();
		var stream = jscs();

		stream.pipe(jscs.reporter('inlinesingle')).on('end', function () {
			assert(/line 1, col 8, disallowMultipleVarDecl: Multiple var declaration/.test(stdoutStub));
			teardown();
			cb();
		}).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'fixture.js'),
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});

	it('`.reporter()` should accept a function', function (cb) {
		function reporterFn(errors) {
			assert(/Multiple var declaration/.test(errors[0].explainError(errors[0].getErrorList()[0], false)));
			cb();
		}

		var stream = jscs();

		stream.pipe(jscs.reporter(reporterFn)).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'fixture.js'),
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});

	it('`fail` reporter should emit an error at the end of the stream', function (cb) {
		var stream = jscs();
		var passedErrorAssertion = false;

		stream
			.pipe(jscs.reporter('fail'))
			.on('error', function (err) {
				assert(err instanceof Error && /JSCS/.test(err.message));
				passedErrorAssertion = true;
			})
			.pipe(streamAssert.length(2))
			.pipe(streamAssert.first(function (file) {
				var errors = file.jscs.errors;
				assert(/Multiple var declaration/.test(errors.explainError(errors.getErrorList()[0], false)));
			}))
			.pipe(streamAssert.second(function (file) {
				assert(file.jscs.success);
			}))
			.pipe(streamAssert.end(function (err) {
				if (err) {
					cb(err);
					return;
				}

				assert(passedErrorAssertion, 'Did not emit an error');
				cb();
			}));

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'fixture.js'),
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'passing.js'),
			contents: new Buffer('var x = 1; var y = 2;')
		}));

		stream.end();
	});

	it('`failImmediately` reporter should emit an error immediately', function (cb) {
		var stream = jscs();

		stream
			.pipe(jscs.reporter('failImmediately'))
			.on('error', function (err) {
				assert(err instanceof Error && /JSCS/.test(err.message));
				cb();
			})
			.pipe(streamAssert.second(function () {
				cb(new Error('Did not emit an error immediately'));
			}))
			.pipe(streamAssert.end());

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'fixture.js'),
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.write(new gutil.File({
			base: __dirname,
			path: path.join(__dirname, 'passing.js'),
			contents: new Buffer('var x = 1; var y = 2;')
		}));

		stream.end();
	});
});
