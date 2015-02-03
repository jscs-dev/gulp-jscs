'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var jscs = require('./');

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
	stubStdout();
	this.timeout(5000);
	var stream = jscs();

	stream.pipe(jscs.reporter()).pipe(jscs.reporter('fail')).on('error', function (err) {
		assert(/Illegal space before/.test(stdoutStub) && /Multiple var declaration/.test(stdoutStub));
		teardown();
		cb();
	}).resume();

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
	stubStdout();
	var stream = jscs({preset: 'google'});

	stream.pipe(jscs.reporter()).pipe(jscs.reporter('fail')).once('error', function (err) {
		assert(/Missing line feed at file end/.test(stdoutStub));
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

it('should pass valid files', function (cb) {
	var stream = jscs();

	stream.pipe(jscs.reporter()).pipe(jscs.reporter('fail')).on('error', function (err) {
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

	stream.pipe(jscs.reporter()).pipe(jscs.reporter('fail')).on('error', function (err) {
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
	stubStdout();
	var stream = jscs({
		esnext: true,
		configPath: '.jscsrc'
	});

	stream.pipe(jscs.reporter()).pipe(jscs.reporter('fail')).once('error', function (err) {
		assert(!/Unexpected reserved word/.test(stdoutStub) && /Multiple var declaration/.test(stdoutStub));
		teardown();
		cb();
	}).resume();

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
