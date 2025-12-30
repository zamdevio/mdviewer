"use client";

import { ReactNode } from "react";

/**
 * Emoji Component
 * Converts emoji shortcodes (like :smile:) to actual emojis
 * Also supports Unicode emojis directly
 */
export function MarkdownEmoji({ children }: { children: ReactNode }) {
    // Common emoji mappings
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

    if (typeof children !== 'string') {
        return <>{children}</>;
    }

    let text = String(children);
    
    // Replace emoji shortcodes
    for (const [shortcode, emoji] of Object.entries(emojiMap)) {
        text = text.replace(new RegExp(shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), emoji);
    }

    return <>{text}</>;
}

