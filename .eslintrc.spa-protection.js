/**
 * Custom ESLint Rules for SPA Protection
 * 
 * These rules prevent common anti-patterns that break single-page application behavior
 */

module.exports = {
  rules: {
    // Prevent HTML forms with action/method attributes
    'no-html-form-submission': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent HTML forms with action/method that break SPA behavior',
          category: 'SPA Protection',
          recommended: true,
        },
        messages: {
          htmlFormSubmission: 'HTML forms with action/method break SPA behavior. Use client-side form handling with fetch API instead.',
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.name === 'form') {
              const hasAction = node.attributes.some(
                attr => attr.name && attr.name.name === 'action'
              );
              const hasMethod = node.attributes.some(
                attr => attr.name && attr.name.name === 'method'
              );
              
              if (hasAction || hasMethod) {
                context.report({
                  node,
                  messageId: 'htmlFormSubmission',
                });
              }
            }
          },
        };
      },
    },

    // Prevent window.location usage
    'no-window-location': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent window.location usage that breaks SPA behavior',
          category: 'SPA Protection',
          recommended: true,
        },
        messages: {
          windowLocation: 'window.location breaks SPA behavior. Use Next.js router.push() instead.',
        },
      },
      create(context) {
        return {
          MemberExpression(node) {
            if (
              node.object.name === 'window' &&
              node.property.name === 'location'
            ) {
              context.report({
                node,
                messageId: 'windowLocation',
              });
            }
          },
        };
      },
    },

    // Prevent HTML anchor tags for internal navigation
    'no-html-anchor-internal': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent HTML anchor tags for internal navigation',
          category: 'SPA Protection',
          recommended: true,
        },
        messages: {
          htmlAnchor: 'Use Next.js Link component instead of <a> tags for internal navigation to preserve SPA behavior.',
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.name === 'a') {
              const hrefAttr = node.attributes.find(
                attr => attr.name && attr.name.name === 'href'
              );
              
              if (hrefAttr && hrefAttr.value) {
                const href = hrefAttr.value.value;
                // Check if it's an internal link (starts with / but not //)
                if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
                  context.report({
                    node,
                    messageId: 'htmlAnchor',
                  });
                }
              }
            }
          },
        };
      },
    },
  },
};


