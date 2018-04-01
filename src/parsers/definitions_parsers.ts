"use strict";
import classOrModule from "./definitions/class_or_module";
import constant from "./definitions/constant";
import method from "./definitions/method";

// All available definitions parsers.
// Definitions include class or module definition (class ...), method definition (def ...)
//   or constant definition (FOO=...).
export default [
  method,
  classOrModule,
  constant,
];
