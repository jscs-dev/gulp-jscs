'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var jscs = require('./');
var streamAssert = require('stream-assert');

var stdoutWrite = process.stdout.write;
var stdoutStub;

function stubStdout() {
	stdoutStub = '';
	process.stdout.write = function(str) {
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
		path: __dirname + '/fixture.js',
		contents: new Buffer('var x = 1,y = 2;')
	}));

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture2.js',
		contents: new Buffer('var x = { a: 1 };')
	}));

	stream.end();
});

it('should check code style of JS files using a preset', function (cb) {
	var stream = jscs({preset: 'google'});

	stream
		.pipe(streamAssert.first(function (file) {
			var errors = file.jscs.errors;
			assert(/Missing line feed at file end/.test(errors.explainError(errors.getErrorList()[1], false)));
		}))
		.pipe(streamAssert.end(cb));

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture.js',
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
		path: __dirname + '/fixture.js',
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
		path: __dirname + '/excluded.js',
		contents: new Buffer('var x = { a: 1 };')
	}));

	stream.end();
});

it('should accept both esnext and configPath options', function(cb) {
	var stream = jscs({
		esnext: true,
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
		path: __dirname + '/fixture.js',
		contents: new Buffer('import x from \'x\'; var x = 1, y = 2;')
	}));

	stream.end();
});

it('should accept the fix option', function (cb) {
	var data = '';

	var stream = jscs({
		fix: true,
		configPath: '.jscsrc'
	});

	stream.on('data', function (file) {
		assert.equal(file.contents.toString(), 'var x = {a: 1, b: 2}');
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture.js',
		contents: new Buffer('var x = { a: 1, b: 2 }')
	}));

	stream.end();
});

it('should throw when passing both configPath and code style options', function () {
	assert.throws(jscs.bind(null, {
		configPath: '.jscsrc',
		preset: 'airbnb'
	}), /configPath/);
});

it('should not mutate the options object passed as argument', function () {
	var options = {esnext: true};
	jscs(options);
	assert.equal(options.esnext, true);
});

describe('Reporter', function () {
	it('`.reporter()` called with no arguments should use the default reporter', function (cb) {
		stubStdout();
		var stream = jscs();

		stream.pipe(jscs.reporter()).on('end', function (err) {
			assert(/Multiple var declaration[^]*---\^/.test(stdoutStub));
			teardown();
			cb();
		}).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/fixture.js',
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});

	it('should accept a built-in JSCS reporter name', function (cb) {
		stubStdout();
		var stream = jscs();

		stream.pipe(jscs.reporter('inlinesingle')).on('end', function (err) {
			assert(/line 1, col 0, Multiple var declaration/.test(stdoutStub));
			teardown();
			cb();
		}).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/fixture.js',
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});

	it('`fail` reporter should throw an error', function (cb) {
		var stream = jscs();

		stream.pipe(jscs.reporter('fail')).on('error', function (err) {
			assert(err instanceof Error && /JSCS/.test(err.message));
			cb();
		}).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/fixture.js',
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});

	it('should accept a function', function (cb) {
		function reporterFn(errors) {
			assert(/Multiple var declaration/.test(errors[0].explainError(errors[0].getErrorList()[0], false)));
			cb();
		}

		var stream = jscs();

		stream.pipe(jscs.reporter(reporterFn)).resume();

		stream.write(new gutil.File({
			base: __dirname,
			path: __dirname + '/fixture.js',
			contents: new Buffer('var x = 1,y = 2;')
		}));

		stream.end();
	});
});
