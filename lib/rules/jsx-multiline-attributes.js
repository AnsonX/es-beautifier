const {
  fixingNodes,
} = require('./es-beautifier-state.js');

const create = (context) => {
  const option = context.options[0] || {
    allowSingleLine: true,
    maxAttributesInSingleLine: 3,
    maxLenInSingleLine: 80,
  };
  const allowSingleLine = option.allowSingleLine;
  const maxAttributes = option.maxAttributesInSingleLine;
  const maxLen = option.maxLenInSingleLine;

  const sourceCode = context.getSourceCode();

  const enterJSXOpeningElement = (node) => {
    if (allowSingleLine &&
        node.loc.start.line === node.loc.end.line &&
        (!maxAttributes || node.attributes.length <= maxAttributes) &&
        (!maxLen || sourceCode.lines[node.loc.end.line - 1].length < maxLen)) {
      // we accept one line
      return;
    }

    let parent = node.parent;
    while (parent && parent.loc.start.line === node.loc.start.line) {
      if (fixingNodes.indexOf(parent) >= 0) {
        // we ignore this time as we are still in the process
        return;
      }
      parent = parent.parent;
    }

    let fixed = false;
    let prev = null;
    node.attributes.forEach((curr) => {
      if (prev && prev.loc.end.line === curr.loc.start.line) {
        context.report({
          node,
          message: 'Attribute in JSX should be on a new line.',
          loc: curr.loc.start,
          fix: fixer => fixer.insertTextBefore(curr, '\n'),
        });
        fixed = true;
      }
      prev = curr;
    });

    if (node.attributes.length) {
      const firstToken = sourceCode.getFirstToken(node);
      const lastToken = sourceCode.getLastToken(node);
      const firstChild = node.attributes[0];
      const lastChild = node.attributes[node.attributes.length - 1];
      if (firstToken.loc.end.line === firstChild.loc.start.line) {
        context.report({
          node,
          message: 'Attribute in JSX should be on a new line.',
          loc: firstToken.loc.start,
          fix: fixer => fixer.insertTextBefore(firstChild, '\n'),
        });
        fixed = true;
      }
      if (lastToken.loc.start.line === lastChild.loc.end.line) {
        context.report({
          node,
          message: 'Attribute in JSX should be on a new line.',
          loc: lastToken.loc.end,
          fix: fixer => fixer.insertTextAfter(lastChild, '\n'),
        });
        fixed = true;
      }
    }

    if (fixed) fixingNodes.push(node);
  };

  return {
    JSXOpeningElement: enterJSXOpeningElement,
  };
};

module.exports = {
  meta: {
    docs: {
      description: 'enforce multi-line attributes in JSX',
      category: 'Stylistic Issues',
    },
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      properties: {
        allowSingleLine: { type: 'boolean' },
        maxAttributesInSingleLine: { type: 'integer' },
        maxLenInSingleLine: { type: 'integer' },
      },
      additionalProperties: false,
    }],
  },
  create,
};