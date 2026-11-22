/**
 * Remark Emoji Plugin
 * 
 * Transforms emoji shortcodes (e.g., :smile:) into Unicode emojis
 * during the parsing phase. This is more efficient than doing it
 * during React rendering as it avoids recursive tree traversal.
 */

import { Node, Parent, Root, Text } from 'mdast';
import { Plugin } from 'unified';

const emojiMap: Record<string, string> = {
    ':smile:': '😊',
    ':grin:': '😁',
    ':laughing:': '😆',
    ':joy:': '😂',
    ':wink:': '😉',
    ':heart:': '❤️',
    ':thumbsup:': '👍',
    ':thumbsdown:': '👎',
    ':fire:': '🔥',
    ':rocket:': '🚀',
    ':star:': '⭐',
    ':check:': '✅',
    ':cross:': '❌',
    ':warning:': '⚠️',
    ':bulb:': '💡',
    ':tada:': '🎉',
    ':clap:': '👏',
    ':muscle:': '💪',
    ':ok_hand:': '👌',
    ':pray:': '🙏',
    ':eyes:': '👀',
    ':thinking:': '🤔',
    ':point_right:': '👉',
    ':point_left:': '👈',
    ':up:': '👆',
    ':down:': '👇',
    ':100:': '💯',
    ':sparkles:': '✨',
    ':zap:': '⚡',
    ':trophy:': '🏆',
    ':medal:': '🏅',
    ':party:': '🎊',
    ':confetti:': '🎈',
    ':gift:': '🎁',
    ':cake:': '🎂',
    ':birthday:': '🎂',
    ':balloon:': '🎈',
};

// Create a single regex for all emoji shortcodes
// Escape special characters in shortcodes
const escapedShortcodes = Object.keys(emojiMap).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const emojiRegex = new RegExp(escapedShortcodes.join('|'), 'gi');

export const remarkEmoji: Plugin<[], Root> = () => {
    return (tree) => {
        // Recursive function to visit all text nodes
        function visit(node: Node) {
            if (node.type === 'text') {
                const textNode = node as Text;
                if (textNode.value.includes(':')) {
                    textNode.value = textNode.value.replace(emojiRegex, (match) => {
                        return emojiMap[match.toLowerCase()] || match;
                    });
                }
            }

            if ('children' in node && node.children) {
                (node as Parent).children.forEach(visit);
            }
        }

        visit(tree);
    };
};
