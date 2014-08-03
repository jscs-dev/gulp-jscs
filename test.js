'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var jscs = require('./index');

it('should check code style of JS files', function (cb) {
	var stream = jscs();

	stream.on('error', function (err) {
		if (/Illegal space before/.test(err) && /Multiple var declaration/.test(err)) {
			assert(true);
			cb();
		}
	});

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

	stream.on('error', function (err) {
		if (/Missing line feed at file end/.test(err)) {
			assert(true);
			cb();
		}
	});

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/fixture.js',
		contents: new Buffer('var x = 1,y = 2;')
	}));

	stream.end();
});

it('should pass valid files', function (cb) {
	var stream = jscs();

	stream.on('data', function () {});

	stream.on('error', function (err) {
		assert(false);
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer('var x = 1; var y = 2;')
	}));

	stream.end();
});

it('should respect "excludeFiles" from config', function (cb) {
	var stream = jscs();

	stream.on('data', function () {});

	stream.on('error', function (err) {
		assert(!err, err);
	});

	stream.on('end', cb);

	stream.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/excluded.js',
		contents: new Buffer('var x = { a: 1 };')
	}));

	stream.end();
});

