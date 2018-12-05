'use strict';

exports.type = 'perItemReverse';

exports.active = true;

exports.description = 'Collect shapes with the same class attribute into <g> elements and promote the class attribute to the group';

var JSAPI = require('../lib/svgo/jsAPI'),
    CSSClassList = require('../lib/svgo/css-class-list'),
    CSSStyleDeclaration = require('../lib/svgo/css-style-declaration');

/**
 * Collect shapes with the same class attribute into <g> elements and promote the class attribute to the group.
 * Skips elements with multiple classnames.
 *
 * @example
 * <path class="cls-1" id="first" d="..."/>
 * <path class="cls-1" id="second" d="..."/>
 * <path class="cls-2" id="third" d="..."/>
 * <path class="cls-1" id="fourth" d="..."/>
 * <path class="cls-1 cls-3" id="fifth" d="..."/>
 *         ⬇
 * <g class="cls-1">
 *     <path id="first" d="..."/>
 *     <path id="second" d="..."/>
 * </g>
 * <path class="cls-2" id="third" d="..."/>
 * <path class="cls-1" id="fourth" d="..."/>
 * <path class="cls-1 cls-3" id="fifth" d="..."/>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 * 
 * @author Jon Maloto (@boompsy)
 */
exports.fn = function (item) {
    var childIndexesToGroup = new Map(),
        newGroup,
        elemsWithThisClass,
        childrenPreviouslyRemoved = 0;

    // Only process non-empty elements that have multiple children that are not <switch>
    if (!item.isElem() || item.isElem('switch') || item.isEmpty() || item.content.length < 2)
        return;

    // Collect a list of consecutive children of the current item that have the same class name.
    // This list is saved to childIndexesToGroup.
    item.content.forEach(function (child, i) {
        var _prevChild = item.content[i - 1],
            _prevClass = _prevChild ? _prevChild.class.getClassValue() : "",
            _currClass = child.class.getClassValue(),
            _indexesWithThisClass;

        // Proceed if:
        // 1. There is a previous child, and
        // 2. The previous and current class are identical and non-zero in length, and
        // 3. The current class attribute doesn't contain multiple classnames
        if (_prevChild && (_prevClass.length > 0) && (_prevClass === _currClass) && _currClass.indexOf(" ") < 0) {
            _indexesWithThisClass = childIndexesToGroup.get(_currClass);

            if (typeof _indexesWithThisClass === "undefined") {
                childIndexesToGroup.set(_currClass, [i - 1]);
                _indexesWithThisClass = childIndexesToGroup.get(_currClass);
            }
            // Only add to the array if the values are consecutive
            if (_indexesWithThisClass[_indexesWithThisClass.length - 1] === i - 1) {
                _indexesWithThisClass.push(i);
            }
        }
    });

    // For each class, wrap the corresponding elements in a <g> group that has the same class attribute
    // and promote the class attribute from the children to the <g>
    childIndexesToGroup.forEach(function (indexes, className, map) {
        elemsWithThisClass = indexes.map(function (childIdx) {
            return item.content[childIdx - childrenPreviouslyRemoved]
        });
        
        elemsWithThisClass.forEach(function (elem, i) {
            if (elem.class) {
                elem.class.remove(className);
            }
        });

        newGroup = (new JSAPI({
            elem: 'g',
            prefix: '',
            local: 'g',
            attrs: {
                class: {
                    name: 'class',
                    value: className,
                    prefix: '',
                    local: 'class'
                }
            },
            content: elemsWithThisClass
        })).clone();
        newGroup.class = new CSSClassList(newGroup);
        newGroup.style = new CSSStyleDeclaration(newGroup); // needed even if empty
        newGroup.class.add(className);

        item.spliceContent(indexes[0] - childrenPreviouslyRemoved, indexes.length, newGroup);

        childrenPreviouslyRemoved += (indexes.length - 1);
    });    
};
