"use strict";
import attribute from "./definitions/attribute";
import classOrModule from "./definitions/class_or_module";
import constant from "./definitions/constant";
import method from "./definitions/method";

// All available definitions parsers, each one is checked against syntax tree nodes.
// Definitions include class or module definition (class ...), method definition (def ...),
//   constant definition (FOO=...) or attribute definition (attr_reader :foo).
export default [
  attribute,
  method,
  classOrModule,
  constant,
];
