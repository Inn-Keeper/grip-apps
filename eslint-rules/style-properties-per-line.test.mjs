import { RuleTester } from "eslint";
import rule from "./style-properties-per-line.mjs";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
});

tester.run("style-properties-per-line", rule, {
  valid: [
    'const view = <div style={{ color: "red" }} />;',
    `const view = <div style={{
  color: "red",
  background: "blue",
}} />;`,
  ],
  invalid: [
    {
      code: 'const view = <div style={{ color: "red", background: "blue" }} />;',
      output: `const view = <div style={{
    color: "red",
    background: "blue"
  }} />;`,
      errors: [{ messageId: "propertiesOnOwnLines" }],
    },
    {
      code: `const view = <div style={{
  color: "red", background: "blue",
}} />;`,
      output: `const view = <div style={{
    color: "red",
    background: "blue",
  }} />;`,
      errors: [{ messageId: "propertiesOnOwnLines" }],
    },
  ],
});
