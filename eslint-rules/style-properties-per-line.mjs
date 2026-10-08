export default {
  meta: {
    type: "layout",
    docs: { description: "require one property per line in JSX style objects" },
    fixable: "whitespace",
    schema: [],
    messages: { propertiesOnOwnLines: "Each JSX style property must be on its own line." },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      JSXAttribute(node) {
        if (node.name.name !== "style" || node.value?.type !== "JSXExpressionContainer") return;

        const expression = node.value.expression;
        if (expression.type !== "ObjectExpression" || expression.properties.length < 2) return;

        const { properties } = expression;
        const isMultiline =
          properties[0].loc.start.line > expression.loc.start.line &&
          properties.every(
            (property, index) => index === 0 || properties[index - 1].loc.end.line < property.loc.start.line,
          ) &&
          properties.at(-1).loc.end.line < expression.loc.end.line;
        if (isMultiline) return;

        const commentInsideObject = sourceCode
          .getAllComments()
          .some((comment) => comment.range[0] > expression.range[0] && comment.range[1] < expression.range[1]);
        const openingElement = node.parent.parent;
        const line = sourceCode.lines[openingElement.loc.start.line - 1];
        const baseIndent = line.slice(0, openingElement.loc.start.column).match(/^\s*/)?.[0] ?? "";
        const propertyIndent = `${baseIndent}    `;
        const closingIndent = `${baseIndent}  `;
        const trailingComma = sourceCode.getTokenAfter(properties.at(-1))?.value === ",";

        context.report({
          node: expression,
          messageId: "propertiesOnOwnLines",
          fix: commentInsideObject
            ? undefined
            : (fixer) => [
                fixer.replaceTextRange([expression.range[0] + 1, properties[0].range[0]], `\n${propertyIndent}`),
                ...properties.slice(1).map((property, index) => {
                  const previous = properties[index];
                  return fixer.replaceTextRange([previous.range[1], property.range[0]], `,\n${propertyIndent}`);
                }),
                fixer.replaceTextRange(
                  [properties.at(-1).range[1], expression.range[1] - 1],
                  `${trailingComma ? "," : ""}\n${closingIndent}`,
                ),
              ],
        });
      },
    };
  },
};
