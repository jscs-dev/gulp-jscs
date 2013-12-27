# [gulp](https://github.com/wearefractal/gulp)-jscs [![Build Status](https://secure.travis-ci.org/sindresorhus/gulp-jscs.png?branch=master)](http://travis-ci.org/sindresorhus/gulp-jscs)

> Check JavaScript code style with [jscs](https://github.com/mdevils/node-jscs)

![](screenshot.png)

*Issues with the output should be reported on the [jscs issue tracker](https://github.com/mdevils/node-jscs/issues).*


## Install

Install with [npm](https://npmjs.org/package/gulp-jscs)

```
npm install --save-dev gulp-jscs
```


## Example

```js
var gulp = require('gulp');
var jscs = require('gulp-jscs');

gulp.task('default', function () {
	gulp.src('src/app.js')
		.pipe(jscs());
});
```


## Docs

This task is configured using [.jscs.json](https://github.com/mdevils/node-jscs#configuration) file, located in the same folder as your gulpfile.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
