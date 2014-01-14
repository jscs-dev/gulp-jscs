'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var jscs = require('./index');

it('should check code style of JS files', function (cb) {
	var stream = jscs();

	stream.on('error', function (err) {
		if (/Illegal space before/.test(err)) {
			assert(true);
			cb();
		}
	});

	stream.write(new gutil.File({
		contents: new Buffer('var x = 1,y = 2;')
	}));

	stream.write(new gutil.File({
		contents: new Buffer('var x = { a: 1 };')
	}));

	stream.end();
});
