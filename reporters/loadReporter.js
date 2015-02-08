'use strict';
var getReporter = require('jscs/lib/cli-config').getReporter;

module.exports = function (reporter) {
	// we want the function
	if (typeof reporter === 'function') return reporter;

	// load JSCS built-in or full-path or module reporters
	if (typeof reporter === 'string' || !reporter) {
		var rpt = getReporter(reporter).writer;
		if (rpt) return rpt;
		try {
			return require(reporter);
		} catch (err) {}
	}
};
