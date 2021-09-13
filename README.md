# htm-lisp
A Lisp-like programming language that allows you to write code in HTML using custom tags.

## Quick introduction
- Use custom HTML elements to declare variables, call functions, compute etc.
- Every element is evaluated and returns a value:
    - Declarations
    - If-statements
    - Loops
    - Casts
    - Prints
    - Literally everything
- The content of an element can be
    - Another element, or multiple elements (nesting)
    - A literal value
    - But not both at the same time
- Most of the commonly used JavaScript data types are available
    - Integers and floats
    - Strings
    - Arrays and objects
- The use of HTML attributes is avoided
    - You can't insert variable values into attributes!
    - That's too restricting...
    - There are exception(s)
- Output gets logged in the browser's console
- Input is read with `prompt`

## Getting started
1. Include the `htm-lisp.js` in the `head` of an HTML document.
```html
<script src="/path/to/htm-lisp.js"></script>
```
2. Insert a `htm-lisp` element in the document body. The code will be written there.
```html
<htm-lisp>

    <!-- Hello world in htm-lisp -->
    <print>Hello, world!</print>

</htm-lisp>
```
3. Optionally, you can configure the console output styles in the `htm-lisp` element's attributes.
```html
<htm-lisp font-size="20px" color="cyan">
    ...
</htm-lisp>
```
## Examples
```html
<!-- x = 1 -->
<def>
    <l>x</l>
    <int>1</int>
</def>

<!-- y = 2 -->
<def>
    <l>y</l>
    <int>2</int>
</def>

<!-- z = x + y -->
<def>
    <l>z</l>
    <add>
        <var>x</var>
        <var>y</var>
    </add>
</def>
```

## Elements
A simple Lisp-like notation is used to describe every element. The notation follows the rule:

`(elementName[attributes?] argument1 ...varArgs) => returnValue`

### DEF
Declares a new variable of any type in the **local** scope. Returns the value of the declared variable.

`(def varName value) => value`
```html
<!-- x = 1 -->
<def>
    <l>x</l>
    <int>1</int>
</def>
```

### MUT
Mutates an already existing variable. Returns the new value of the variable. The variable may exist in the local scope or the global scope. Throws an error if the variable is undefined.

`(mut varName value) => value`
```html
<!-- x = 2 -->
<mut>
    <l>x</l>
    <int>2</int>
</mut>
```

### INC
Increments an existing variable's value.

`(inc varName value) => newValue`
```html
<!-- x += 1 -->
<inc>
    <l>x</l>
    <int>1</int>
</inc>
```

### DEC
Decrements an existing variable's value.

`(dec varName value) => newValue`
```html
<!-- x -= 1 -->
<dec>
    <l>x</l>
    <int>1</int>
</dec>
```

### VAR
Returns the value of a variable. The variable may exist in the local scope or the global scope. Throws an error if the variable is undefined.

`(var varName) => value`
```html
<!-- x -->
<var>
    <l>x</l>
</var>
```

### BLOCK
Creates a local scope for elements and returns the lastly evaluated element.

`(block ...element) => value`
```html
<!-- Evaluates to 10 -->
<block>

    <def>
        <l>x</l>
        <int>5</int>
    </def>

    <add>
        <var>
            <l>x</l>
        </var>
        <int>5</int>
    </add>

</block>
```

### PRINT
Prints the provided values in the browser's console. Returns the printed output as a string.

`(print[sep=" "] ...values) => stringValue`
```html
<!-- Prints and evaluates to "5 10" -->
<print>

    <def>
        <l>x</l>
        <int>5</int>
    </def>

    <add>
        <var>
            <l>x</l>
        </var>
        <int>5</int>
    </add>

</print>
```

### NOOP
Do nothing. You can use this for some optional arguments.

`(noop) => null`
```html
<!-- Evaluates to null -->
<noop></noop>
```

## Type Elements
These elements are used to cast literal values into some specific type.

### L
Returns the literal value. Evaluates the inner text of the element. You may want to use this (or the `str` element) when declaring or referring to variable names, as the variables are stored by name in a JavaScript object. Does not accept any child elements.

`(l literalValue) => value`
```html
<!-- Evaluates to a JS Number 123 -->
<l>123</l>

<!-- Evaluates to a JS String "Hello" -->
<l>Hello</l>
```

### INT
Returns an integer. Calls JS `parseInt` on the provided value.

`(int value) => parseInt(value)`
```html
<!-- Evaluates to a JS Number 2 -->
<int>2.5</int>
```

### FLOAT
Returns an floating point number. Calls JS `parseFloat` on the provided value.

`(float value) => parseFloat(value)`
```html
<!-- Evaluates to a JS Number 2.5 -->
<int>2.5</int>
```

### STR
Returns an string. Calls JS `toString` on the provided value.

`(str value) => value.toString()`
```html
<!-- Evaluates to a JS String "2.5" -->
<str>2.5</str>
```

