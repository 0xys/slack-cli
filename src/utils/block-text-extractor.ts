interface BlockElement {
  type: string;
  text?: string;
  user_id?: string;
  channel_id?: string;
  url?: string;
  name?: string;
  unicode?: string;
  range?: string;
}

interface RichTextElement {
  type: string;
  elements?: (BlockElement | RichTextElement)[];
  style?: string;
}

interface Block {
  type: string;
  elements?: RichTextElement[];
  text?: { type: string; text: string };
}

function extractInlineText(element: BlockElement): string {
  switch (element.type) {
    case 'text':
      return element.text || '';
    case 'user':
      return `<@${element.user_id}>`;
    case 'channel':
      return `<#${element.channel_id}>`;
    case 'link':
      if (element.text) {
        return `${element.text} (${element.url})`;
      }
      return element.url || '';
    case 'emoji':
      if (element.unicode) {
        return String.fromCodePoint(Number.parseInt(element.unicode, 16));
      }
      return `:${element.name}:`;
    case 'broadcast':
      return `@${element.range}`;
    default:
      return '';
  }
}

function extractSectionText(elements: BlockElement[]): string {
  return elements.map(extractInlineText).join('');
}

function extractRichTextElementText(element: RichTextElement): string {
  const childElements = (element.elements || []) as BlockElement[];

  switch (element.type) {
    case 'rich_text_section':
      return extractSectionText(childElements);
    case 'rich_text_preformatted':
      return `\`\`\`\n${extractSectionText(childElements)}\n\`\`\``;
    case 'rich_text_quote':
      return `> ${extractSectionText(childElements)}`;
    case 'rich_text_list': {
      const isBullet = element.style === 'bullet';
      return childElements
        .map((item, index) => {
          const itemElements = (item as unknown as RichTextElement).elements as BlockElement[];
          const text = extractSectionText(itemElements || []);
          return isBullet ? `• ${text}` : `${index + 1}. ${text}`;
        })
        .join('\n');
    }
    default:
      return '';
  }
}

function extractRichTextBlock(block: Block): string {
  if (!block.elements) return '';
  return block.elements.map(extractRichTextElementText).filter(Boolean).join('\n');
}

function extractBlockText(block: Block): string {
  switch (block.type) {
    case 'rich_text':
      return extractRichTextBlock(block);
    case 'section':
    case 'header':
      return block.text?.text || '';
    default:
      return '';
  }
}

export function extractTextFromBlocks(blocks: unknown[] | undefined): string {
  if (!blocks || blocks.length === 0) return '';
  return (blocks as Block[]).map(extractBlockText).filter(Boolean).join('\n');
}
