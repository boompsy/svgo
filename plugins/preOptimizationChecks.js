'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'inline styles (additional options)';

var JSAPI = require('../lib/svgo/jsAPI');

require('colors');

exports.fn = function (data, params, info) {
    var svg = data.content[0], errStrings = [], filename = info.path.substring(info.path.lastIndexOf("\\") + 1);
    
    if (!svg || !svg.isElem('svg')) return data;

    if (!svg.hasAttr("viewBox") || !svg.hasAttr("width") || !svg.hasAttr("height")) {
        errStrings.push("- <svg> element must have 'viewBox', 'width', and 'height' defined.");
    }

    if (!data.querySelectorAll("[class*='themed']")) {
        errStrings.push("- This SVG contains no 'themed' shapes.");
    } else if (data.querySelectorAll(`[fill='#246fb5']:not([class*='defaultFill-BrandPrimary']),
                                      [fill='#0091ea']:not([class*='defaultFill-BrandSecondary']),
                                      [fill='#00a1db']:not([class*='defaultFill-BrandTertiary']),
                                      [fill='#52cc6e']:not([class*='defaultFill-PositiveBright']),
                                      [fill='#d9545b']:not([class*='defaultFill-NegativeDim'])`)) {
        errStrings.push("- One or more shapes is missing a 'defaultFill' class name based on their fill value.");
    }

    if (errStrings.length > 0) {
        console.error("\nErrors found in ".red + filename.yellow + " -- output has been emptied.".red);
        while (errStrings.length > 0) {
            console.log(errStrings.pop());
        }
        return new JSAPI({ elem: '#document', content: [] });
    }
    return data;
};
