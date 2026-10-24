"use strict";
import association from "./definitions/association";
import attribute from "./definitions/attribute";
import classOrModule from "./definitions/class_or_module";
import concernBlock from "./definitions/concern_block";
import constant from "./definitions/constant";
import defineMethod from "./definitions/define_method";
import delegation from "./definitions/delegation";
import method from "./definitions/method";
import scope from "./definitions/scope";
import struct from "./definitions/struct";

// All available definitions parsers, each one is checked against syntax tree nodes.
// Definitions include class or module definition (class ...), method definition (def ...),
//   constant definition (FOO=...) or attribute definition (attr_reader :foo).
// Methods and attributes YARD doesn't see are documented with directives: define_method, delegate, scope,
//   has_many etc. Definitions within blocks of ActiveSupport::Concern are documented with directives above a block.
//   Struct and Data classes assigned to constants go before other constants.
export default [
  attribute,
  method,
  defineMethod,
  delegation,
  scope,
  association,
  concernBlock,
  classOrModule,
  struct,
  constant,
];
