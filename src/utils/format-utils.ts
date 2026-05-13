import { Message } from '../types/slack';
import { extractTextFromAttachments, extractTextFromBlocks } from './block-text-extractor';
import { USER_MENTION_PATTERN } from './slack-patterns';
import { sanitizeTerminalText } from './terminal-sanitizer';

export function formatMessageWithMentions(message: string, users: Map<string, string>): string {
  const sanitizedMessage = sanitizeTerminalText(message);

  // Replace <@USERID> mentions with @username
  return sanitizedMessage.replace(USER_MENTION_PATTERN, (match, userId) => {
    const username = sanitizeTerminalText(users.get(userId) || userId);
    return `@${username}`;
  });
}

export function resolveMessageText(message: Message, users: Map<string, string>): string | null {
  if (message.text) {
    return formatMessageWithMentions(message.text, users);
  }
  const blockText = extractTextFromBlocks(message.blocks);
  if (blockText) {
    return formatMessageWithMentions(blockText, users);
  }
  const attachmentText = extractTextFromAttachments(message.attachments);
  if (attachmentText) {
    return formatMessageWithMentions(attachmentText, users);
  }
  return null;
}

export function resolveAttachmentsText(
  message: Message,
  users: Map<string, string>
): string | null {
  if (!message.text && !extractTextFromBlocks(message.blocks)) {
    return null;
  }
  const attachmentText = extractTextFromAttachments(message.attachments);
  if (!attachmentText) return null;
  return formatMessageWithMentions(attachmentText, users);
}

export function resolveUsername(message: Message, users: Map<string, string>): string {
  if (message.user) {
    return sanitizeTerminalText(users.get(message.user) || 'Unknown User');
  }
  if (message.bot_id) {
    return 'Bot';
  }
  return 'Unknown';
}
