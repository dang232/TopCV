import ts from 'typescript';
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/dang232/TopCV',
);

function isDeprecatedSymbol(symbol) {
  if (!symbol) return false;

  const tags = typeof symbol.getJsDocTags === 'function' ? symbol.getJsDocTags() : [];
  return tags.some((t) => t?.name === 'deprecated');
}

export default createRule({
  name: 'no-deprecated-symbol',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of symbols marked @deprecated',
    },
    schema: [],
    messages: {
      deprecatedSymbol: "Usage of deprecated symbol '{{name}}' is not allowed.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = context.sourceCode.parserServices;
    const checker = services?.program?.getTypeChecker?.();
    const esTreeNodeToTSNodeMap = services?.esTreeNodeToTSNodeMap;

    if (!checker || !esTreeNodeToTSNodeMap) {
      // Not type-aware; silently do nothing.
      return {};
    }

    /** @type {WeakSet<object>} */
    const reported = new WeakSet();

    function reportIfDeprecated(node, tsNode) {
      if (reported.has(node)) return;

      let symbol = checker.getSymbolAtLocation(tsNode);
      if (!symbol) return;

      // eslint-disable-next-line no-bitwise
      if (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = checker.getAliasedSymbol(symbol);
      }

      if (!isDeprecatedSymbol(symbol)) return;

      reported.add(node);
      context.report({
        node,
        messageId: 'deprecatedSymbol',
        data: { name: symbol.getName() },
      });
    }

    return {
      Identifier(node) {
        // Avoid double-reporting the property identifier; the Identifier visitor
        // will already see it.
        if (
          node.parent?.type === 'MemberExpression' &&
          node.parent.property === node &&
          node.parent.computed === false
        ) {
          return;
        }

        // `import { Foo } from 'x'` has two identifiers (`imported` and `local`)
        // even when they have the same name. Only report the local binding.
        if (
          node.parent?.type === 'ImportSpecifier' &&
          node.parent.imported === node &&
          node.parent.local?.name === node.name
        ) {
          return;
        }

        const tsNode = esTreeNodeToTSNodeMap.get(node);
        reportIfDeprecated(node, tsNode);
      },
    };
  },
});

