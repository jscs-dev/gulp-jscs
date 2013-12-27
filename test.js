'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var jscs = require('./index');
var out = process.stdout.write.bind(process.stdout);

it('should check code style of JS files', function (cb) {
	var stream = jscs();

	process.stdout.write = function (str) {
		if (/Illegal space before/.test(gutil.colors.stripColor(str))) {
			assert(true);
			process.stdout.write = out;
			cb();
		}
	};

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer('var x = 1,y = 2;')
	}));

	stream.write(new gutil.File({
		path: __dirname + '/fixture2.js',
		contents: new Buffer('var x = { a: 1 };')
	}));
});
