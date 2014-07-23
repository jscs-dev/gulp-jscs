# [gulp](http://gulpjs.com)-jscs [![Build Status](https://travis-ci.org/sindresorhus/gulp-jscs.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-jscs) [![Dependency Status](https://david-dm.org/sindresorhus/gulp-jscs.svg)](https://david-dm.org/sindresorhus/gulp-jscs) [![devDependency Status](https://david-dm.org/sindresorhus/gulp-jscs/dev-status.svg)](https://david-dm.org/sindresorhus/gulp-jscs#info=devDependencies)
> Check JavaScript code style with [jscs](https://github.com/mdevils/node-jscs)

![](screenshot.png)

*Issues with the output should be reported on the jscs [issue tracker](https://github.com/mdevils/node-jscs/issues).*


## Install

```bash
$ npm install --save-dev gulp-jscs
```


## Usage

```js
var gulp = require('gulp');
var jscs = require('gulp-jscs');

gulp.task('default', function () {
	return gulp.src('src/app.js')
		.pipe(jscs());
});
```


## API

### jscs(configPath)

#### configPath

Type: `string`  
Default: `'./.jscsrc'`

Path to the [.jscsrc](https://github.com/mdevils/node-jscs#configuration).


## License

[MIT](http://opensource.org/licenses/MIT) © [Sindre Sorhus](http://sindresorhus.com)
