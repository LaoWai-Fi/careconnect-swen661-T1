// Babel plugin: rewrites `import.meta` to `{ env: globalThis.__VITE_ENV__ }` so modules
// written for Vite can be loaded by Jest. The stub is defined in jest/env.cjs.
module.exports = function viteMetaEnv({ types: t }) {
  return {
    name: 'vite-meta-env',
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('env'),
                t.memberExpression(t.identifier('globalThis'), t.identifier('__VITE_ENV__')),
              ),
            ]),
          );
        }
      },
    },
  };
};
