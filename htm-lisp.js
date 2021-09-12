document.addEventListener("DOMContentLoaded", function() {

    const SCOPE = {
        global: {},
        local: {},
    }


    const TAGS = {

        "DEF": (element, scope) => {
            requireChildrenCount(element, 2)
            const [varName, value] = getAllValues(element, makeScope(scope), 2)
            return setLocalVariable(scope, varName, value)
        },


        "MUT": (element, scope) => {
            requireChildrenCount(element, 2)
            const [varName, value] = getAllValues(element, makeScope(scope), 2)
            return updateVariableValue(varName, value, scope)
        },


        "VAR": (element, scope) => {
            const varName = getValue(element, makeScope(scope))
            return getVariableValue(varName, scope)
        },


        "BLOCK": (element, scope) => {
            return getValue(element, makeScope(scope))
        },


        "PRINT": (element, scope) => {
            const { sep } = getAttributes(element)
            const output = element.childElementCount
            ? getAllValues(element, makeScope(scope))
                .map(x => typeof x === "object" ? JSON.stringify(x) : x)
                .join(sep ?? " ")
            : getInnerText(element)
            console.log("%c" + output, CONSOLE_STYLE)
            return output
        },


        "NOOP": (element, scope) => {
            requireChildrenCount(element, 0, true)
            return null
        },


        "INC": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const [varName, incrementBy] = getAllValues(element, makeScope(scope), 2)
            const currentValue = getVariableValue(varName, scope)
            return updateVariableValue(varName, currentValue + incrementBy, scope)
        },


        "DEC": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const [varName, decrementBy] = getAllValues(element, makeScope(scope), 2)
            const currentValue = getVariableValue(varName, scope)
            return updateVariableValue(varName, currentValue - decrementBy, scope)
        },


        "CONCAT": (element, scope) => {
            requireChildrenCount(element, 2, false)
            const values = getAllValues(element, makeScope(scope))
            return values.join("")
        },


        //
        // TYPES
        //


        /**
         * A literal value.
         * Evaluates the innerText as text.
         */
        "L": (element, scope) => {
            requireChildrenCount(element, 0, true)
            return getInnerText(element)
        },


        /**
         * An integer value.
         * Evaluates the derived value.
         */
        "INT": (element, scope) => {
            let value = getValue(element, makeScope(scope))
            if (typeof value === "string") value = value.replaceAll(" ", "")
            return parseInt(value)
        },


        /**
         * A floating point value.
         * Evaluates the derived value.
         */
         "FLOAT": (element, scope) => {
            let value = getValue(element, makeScope(scope))
            if (typeof value === "string") value = value.replaceAll(" ", "")
            return parseFloat(value)
        },


        /**
         * A string value.
         * Evaluates the derived value.
         */
        "STR": (element, scope) => {
            const value = getValue(element, makeScope(scope))
            return value.toString()
        },


        /**
         * A list value.
         * Evaluates the child elements.
         */
        "LIST": (element, scope) => {
            return getAllValues(element, makeScope(scope))
        },


        //
        // BOOLEAN OPERATIONS
        //


        /**
         * Casts a value to a boolean.
         * Evaluates the derived value.
         */
        "BOOL": (element, scope) => {
            const value = getValue(element, makeScope(scope))
            return !!value
        },


        /**
         * Without children or innerText returns true.
         * Else checks if innerText or derived value is true.
         */
        "TRUE": (element, scope) => {
            if (element.childElementCount) {
                const value = getValue(element, makeScope(scope))
                return !!value === true
            }
            else {
                const value = getInnerText(element, false)
                return value === "" ? true : !!value === true
            }
        },


        /**
         * Without children or innerText returns false.
         * Else checks if innerText or derived value is false.
         */
        "FALSE": (element, scope) => {
            if (element.childElementCount) {
                const value = getValue(element, makeScope(scope))
                return !!value === false
            }
            else {
                const value = getInnerText(element, false)
                return value === "" ? false : !!value === false
            }
        },


        /**
         * ANDs all the children, returning a boolean.
         * Ignores innerText.
         */
         "AND": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x && y)
        },


        /**
         * ORs all the children, returning a boolean.
         * Ignores innerText.
         */
         "OR": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x || y)
        },


        /**
         * Evaluates the derived value and performs a NOT on it.
         */
         "NOT": (element, scope) => {
            requireChildrenCount(element, 1, true)
            return !!!getDerivedValue(element, makeScope(scope))
        },


        //
        // MATH OPERATIONS
        //


        /**
         * Adds the children's values together.
         */
         "ADD": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x + y)
        },


        /**
         * Subtracts the children's values from one another.
         */
         "SUB": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x - y)
        },


        /**
         * Multiplies the children values together.
         */
         "MUL": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x * y)
        },


        /**
         * Divides the children's values with one another.
         */
         "DIV": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x / y)
        },


        /**
         * Gets the modulus of all the children's values.
         */
         "MOD": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x % y)
        },


        /**
         * Raises the child elements to the next's power.
         */
        "POW": (element, scope) => {
            const values = getAllValues(element, makeScope(scope))
            return values.reduce((x, y) => x ** y)
        },


        /**
         * Returns true if all evaluated children are equal.
         */
         "EQ": (element, scope) => {
            requireChildrenCount(element, 2)
            const values = getAllValues(element, makeScope(scope))
            for (let i = 1; i < values.length; i++)
                if (values[0] !== values[i]) return false
            return true
        },


        /**
         * Returns true if the first child does not equal to any of its siblings.
         */
         "NE": (element, scope) => {
            requireChildrenCount(element, 2)
            const values = getAllValues(element, makeScope(scope))
            for (let i = 1; i < values.length; i++)
                if (values[0] === values[i]) return false
            return true
        },


        /**
         * Returns true if the first evaluated child is greater than every other child.
         */
        "GT": (element, scope) => {
            requireChildrenCount(element, 2)
            const values = getAllValues(element, makeScope(scope))
            for (let i = 1; i < values.length; i++)
                if (!(values[0] > values[i])) return false
            return true
        },


        /**
         * Returns true if the first evaluated child is greater or equal to every other child.
         */
         "GTE": (element, scope) => {
            requireChildrenCount(element, 2)
            const values = getAllValues(element, makeScope(scope))
            for (let i = 1; i < values.length; i++)
                if (!(values[0] >= values[i])) return false
            return true
        },


        /**
         * Returns true if the first evaluated child is less than every other child.
         */
         "LT": (element, scope) => {
            requireChildrenCount(element, 2)
            const values = getAllValues(element, makeScope(scope))
            for (let i = 1; i < values.length; i++)
                if (!(values[0] < values[i])) return false
            return true
        },


        /**
         * Returns true if the first evaluated child is less or equal to every other child.
         * (lte arg1 arg2 argN...) => bool
         */
         "LTE": (element, scope) => {
            requireChildrenCount(element, 2)
            const values = getAllValues(element, makeScope(scope))
            for (let i = 1; i < values.length; i++)
                if (!(values[0] <= values[i])) return false
            return true
        },


        //
        // CONDITIONALS
        //


        /**
         * IF the first child evaluates to truthy, returns the second child.
         * Else, returns the optional third child.
         * (if condition thenOp elseOp) => any
         */
         "IF": (element, scope) => {
            requireChildrenCount(element, 2)
            const conditionalElement = element.children[0]
            const thenElement = element.children[1]
            const elseElement = element.children[2]
            return handleElement(conditionalElement, makeScope(scope))
            ? handleElement(thenElement, makeScope(scope))
            : elseElement && handleElement(elseElement, makeScope(scope))
        },


        //
        // STRING OPERATIONS
        //


        /**
         * (split string sep) => list
         */
         "SPLIT": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const [string, sep] = getAllValues(element, makeScope(scope), 2)
            return string.split(sep)
        },


        //
        // LIST OPERATIONS
        //


        /**
         * Makes a for loop. The for loop returns a list of all iterated values.
         * (for varName start stop step operation) => list
         */
        "FOR": (element, scope) => {
            requireChildrenCount(element, 5, true)
            const [varName, start, stop, step] = getAllValues(element, makeScope(scope), 4)
            const iterationOp = element.children[4]
            const result = []
            setLocalVariable(scope, varName, start)
            for (; scope.local[varName].value <= stop; scope.local[varName].value += step) {
                const value = handleElement(iterationOp, makeScope(scope))
                value && result.push(value)
            }
            delete scope.local[varName]
            return result
        },


        /**
         * (while condition body) => list
         */
        "WHILE": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const conditionOp = element.children[0]
            const bodyOp = element.children[1]
            const localScope = makeScope(scope)
            const result = []
            while (handleElement(conditionOp, localScope)) {
                const value = handleElement(bodyOp, localScope)
                value && result.push(value)
            }
            return result
        },


        /**
         * (map iterable varName operation) => list
         */
        "MAP": (element, scope) => {
            requireChildrenCount(element, 3, true)
            const [iterable, varName] = getAllValues(element, makeScope(scope), 2)
            const operation = element.children[2]
            const localScope = makeScope(scope)
            return iterable.map(x => {
                setLocalVariable(localScope, varName, x)
                return handleElement(operation, localScope)
            })
        },


        /**
         * (filter iterable varName operation) => list
         */
        "FILTER": (element, scope) => {
            requireChildrenCount(element, 3, true)
            const [iterable, varName] = getAllValues(element, makeScope(scope), 2)
            const operation = element.children[2]
            const localScope = makeScope(scope)
            return iterable.filter(x => {
                setLocalVariable(localScope, varName, x)
                return handleElement(operation, localScope)
            })
        },


        /**
         * (reduce iterable varName1 varName2 operation) => any
         */
        "REDUCE": (element, scope) => {
            requireChildrenCount(element, 4, true)
            const [iterable, varName1, varName2] = getAllValues(element, makeScope(scope), 3)
            const operation = element.children[3]
            const localScope = makeScope(scope)
            return iterable.reduce((x, y) => {
                setLocalVariable(localScope, varName1, x)
                setLocalVariable(localScope, varName2, y)
                return handleElement(operation, localScope)
            })
        },


        /**
         * Get or set the index in iterable.
         * (idx iterable index newValue?) => any
         */
        "IDX": (element, scope) => {
            requireChildrenCount(element, 2)
            const [iterable, index] = getAllValues(element, makeScope(scope), 2)
            if (Array.isArray(iterable)) {
                if (index in iterable) {
                    if (element.children[2]) {
                        iterable[index] = handleElement(element.children[2], makeScope(scope))
                    }
                    return iterable[index]
                }
                throw new Error(`Index out of bounds: ${index}`)
            }
            else if (typeof iterable === "string") {
                if (index < iterable.length) {
                    return iterable.charAt(index)
                }
                throw new Error(`Index out of bounds: ${index}`)
            }
            throw new Error("IDX can only be used with lists. Got " + typeof iterable)
        },


        /**
         * (len iterable) => int
         */
        "LEN": (element, scope) => {
            requireChildrenCount(element, 1, true)
            return getValue(element, makeScope(scope)).length
        },


        /**
         * (append iterable value) => list
         */
         "APPEND": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const [iterable, value] = getAllValues(element, makeScope(scope), 2)
            const result = Array.from(iterable)
            result.push(value)
            return result
        },


        /**
         * Returns the first element in the list.
         * (fst iterable) => any
         */
        "FST": (element, scope) => {
            requireChildrenCount(element, 1, true)
            const iterable = handleElement(element.children[0], makeScope(scope))
            if (iterable.length > 0) return iterable[0]
            throw new Error("Trying to get first element of an empty iterable!")
        },


        /**
         * Returns the last element in the list.
         * (lst iterable) => any
         */
         "LST": (element, scope) => {
            requireChildrenCount(element, 1, true)
            const iterable = handleElement(element.children[0], makeScope(scope))
            if (iterable.length > 0) return iterable[iterable.length - 1]
            throw new Error("Trying to get first element of an empty iterable!")
        },


        /**
         * Returns a slice of an iterable.
         * (slice iterable start stop) => slicedIterable
         */
        "SLICE": (element, scope) => {
            requireChildrenCount(element, 3, true)
            const [iterable, start, stop] = getAllValues(element, makeScope(scope))
            if (Array.isArray(iterable) || typeof iterable === "string") return iterable.slice(start, stop)
            throw new Error("Iterable must be a list or a string, got " + typeof iterable)
        },


        //
        //
        // OBJECTS

        /**
         * (obj listOfTuples) => object
         */
        "OBJ": (element, scope) => {
            requireChildrenCount(element, 1)
            const result = {}
            for (const pair of getValue(element, makeScope(scope))) {
                if (!Array.isArray(pair) || pair.length !== 2)
                    throw new Error("OBJ requires a list of tuples!")
                result[pair[0]] = pair[1]
            }
            return result
        },


        /**
         * Get or set a key in an object.
         * (key object key value) => value
         */
        "KEY": (element, scope) => {
            requireChildrenCount(element, 2)
            const [object, key] = getAllValues(element, makeScope(scope), 2)
            if (element.children[2]) {
                object[key] = handleElement(element.children[2], makeScope(scope))
            }
            if (key in object) {
                return object[key]
            }
            throw new Error(`Key not found: ${key}`)
        },


        /**
         * (has-key object key) => boolean
         */
         "HAS-KEY": (element, scope) => {
            requireChildrenCount(element, 2)
            const [object, key] = getAllValues(element, makeScope(scope), 2)
            return key in object
        },


        /**
         * A list with two values only.
         * (tuple value1 value2) => list
         */
        "TUPLE": (element, scope) => {
            requireChildrenCount(element, 2, true)
            return getAllValues(element, makeScope(scope), 2)
        },


        ///
        /// FUNCTIONS
        ///


        /**
         * (func paramNameList operation) => function
         */
        "FUNC": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const parameters = handleElement(element.children[0], makeScope(scope))
            const operation = element.children[1]
            return function(scope, ...args) {
                const localScope = makeScope(scope)
                for (let i = 0; i < parameters.length; i++)
                    setLocalVariable(localScope, parameters[i], args[i])
                return handleElement(operation, localScope)
            }
        },


        /**
         * (call function argList?) => any
         */
        "CALL": (element, scope) => {
            requireChildrenCount(element, 1)
            const func = handleElement(element.children[0], makeScope(scope))
            let args = []
            if (element.children[1]) {
                const value = handleElement(element.children[1], makeScope(scope))
                if (!Array.isArray(value)) {
                    throw new Error("The second argument to CALL must be a list!")
                }
                args = value
            }
            return func(scope, ...args)
        },


        //
        // INPUT-OUTPUT
        //


        /**
         * (read promptMessage defaultValue)
         */
        "READ": (element, scope) => {
            requireChildrenCount(element, 2, true)
            const [message, defaultValue] = getAllValues(element, makeScope(scope), 2)
            return prompt(message, defaultValue)
        },

    }


    //
    //  UTIL FUNCTIONS
    //

    /**
     * Makes a scope ready for child elements.
     * @param {object} scope 
     * @returns An object.
     */
    function makeScope(scope) {
        return {global: {...scope.global, ...scope.local}, local: {}}
    }


    /**
     * Evaluates all child elements and returns their values in a list.
     * Calls handle element on every child.
     * @param {*} element 
     * @param {*} scope 
     * @returns A list of values.
     */
    function getAllValues(element, scope, limit = 0) {
        const result = []
        for (const child of element.children) {
            result.push(handleElement(child, scope))
            if (limit && result.length === limit) break 
        }
        return result
    }


    /**
     * Gets the attribute names and values of an element.
     * @param {*} element The element.
     * @returns An object of attribute names and values.
     */
    function getAttributes(element) {
        const result = {}
        for (const attribute of element.attributes) {
            result[attribute.name] = element.getAttribute(attribute.name)
        }
        return result
    }


    /**
     * Gets the inner text of an element.
     * @param {*} element 
     * @param {boolean} inferType 
     * @returns The inner text of an element. The type is inferred.
     */
    function getInnerText(element) {
        const value = element.innerHTML
        return value.trim() === "" ? value : isNaN(value) ? value : +value
    }


    /**
     * Evaluates all the children and returns the last value.
     * @param {*} element 
     * @param {*} scope 
     * @returns The last value of the evaluated children.
     */
    function getDerivedValue(element, scope) {
        let value = null
        for (const child of element.children) {
            value = handleElement(child, scope)
        }
        return value
    }


    /**
     * Gets the value produced by the element's children.
     * If the element has children, returns the derived value.
     * Else, returns the inner text.
     * @param {*} element 
     * @param {*} scope 
     * @param {boolean} inferType
     * @returns The value of an element.
     */
    function getValue(element, scope) {
        return element.childElementCount
        ? getDerivedValue(element, scope)
        : getInnerText(element)
    }


    /**
     * Looks for the variable by name from the given scope.
     * Throws an error if the variable is undefined.
     * @param {*} varName 
     * @param {*} scope 
     * @returns The value of the variable.
     */
    function getVariableValue(varName, scope) {
        if (varName in scope.local) return scope.local[varName].value
        if (varName in scope.global) return scope.global[varName].value
        throw new Error("Undefined variable " + varName)
    }


    /**
     * Updates the variable by name in the given scope.
     * The variable must exist when calling this function.
     * Throws an error if the variable is undefined.
     * @param {*} varName 
     * @param {*} value
     * @param {*} scope 
     * @returns The value of the variable.
     */
     function updateVariableValue(varName, value, scope) {
        if (varName in scope.local) {
            scope.local[varName].value = value
            return value
        }
        if (varName in scope.global) {
            scope.global[varName].value = value
            return value
        }
        throw new Error("Undefined variable " + varName)
    }


    /**
     * Throws an error if the required amount of children is not met.
     * @param {*} element 
     * @param {*} count 
     */
    function requireChildrenCount(element, count = 1, exact = false) {
        const error = exact && element.childElementCount !== count
        ? `${element.tagName} requires exactly ${count} child element(s)!`
        : element.childElementCount < count
        ? `${element.tagName} requires at least ${count} child element(s)!`
        : null
        if (error) throw new Error(error)
    }


    /**
     * Sets a variable in the local scope.
     */
    function setLocalVariable(scope, varName, value) {
        if (varName in scope.local) scope.local[varName].value = value
        else scope.local[varName] = new Variable(value)
        return value
    }


    /**
     * Produces the value of the element.
     * Throws an error if the tag is undefined.
     * @param {*} element 
     * @param {*} scope 
     * @returns 
     */
    function handleElement(element, scope) {
        if (element.tagName in TAGS)
            return TAGS[element.tagName](element, scope)
        throw new Error("Undefined tag: " + element.tagName)
    }


    class Variable {

        constructor(value) {
            this.value = value
        }

        get type() {
            return typeof this.value
        }

    }


    const ROOT = document.querySelector("htm-lisp")
    ROOT.style.display = "none"

    const STYLES = (() => ({
        color: ROOT.getAttribute("color") ?? "chartreuse",
        fontFamily: ROOT.getAttribute("font-family") ?? "'Courier New', Lucida Console, monospace",
        fontSize: ROOT.getAttribute("font-size") ?? "12px",
    }))()

    const CONSOLE_STYLE = `
        color: ${STYLES.color};
        font-family: ${STYLES.fontFamily};
        font-size: ${STYLES.fontSize};
    `

    for (const element of ROOT.children) {
        try { handleElement(element, SCOPE) }
        catch (error) { console.error(error) }
    }

    window.SCOPE = SCOPE
    window.ROOT = ROOT
})