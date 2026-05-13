import { describe, expect, it } from 'vitest';
import { extractTextFromBlocks } from '../../src/utils/block-text-extractor';

describe('extractTextFromBlocks', () => {
  it('should return empty string for undefined blocks', () => {
    expect(extractTextFromBlocks(undefined)).toBe('');
  });

  it('should return empty string for empty blocks array', () => {
    expect(extractTextFromBlocks([])).toBe('');
  });

  it('should extract text from a simple rich_text block', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Hello world');
  });

  it('should concatenate text from multiple elements in a section', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Hello world');
  });

  it('should handle user mentions', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'Hello ' },
              { type: 'user', user_id: 'U123456' },
              { type: 'text', text: '!' },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Hello <@U123456>!');
  });

  it('should handle links with text', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'Check ' },
              { type: 'link', url: 'https://example.com', text: 'this link' },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Check this link (https://example.com)');
  });

  it('should handle links without text', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'link', url: 'https://example.com' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('https://example.com');
  });

  it('should handle emoji elements', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'Hi ' },
              { type: 'emoji', name: 'wave' },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Hi :wave:');
  });

  it('should handle emoji with unicode', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'emoji', name: 'wave', unicode: '1f44b' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('\u{1f44b}');
  });

  it('should handle multiple sections with newlines between them', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'First line' }],
          },
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'Second line' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('First line\nSecond line');
  });

  it('should handle rich_text_preformatted as code block', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_preformatted',
            elements: [{ type: 'text', text: 'const x = 1;' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('```\nconst x = 1;\n```');
  });

  it('should handle rich_text_quote', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_quote',
            elements: [{ type: 'text', text: 'quoted text' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('> quoted text');
  });

  it('should handle rich_text_list with bullet style', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_list',
            style: 'bullet',
            elements: [
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: 'Item 1' }],
              },
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: 'Item 2' }],
              },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('• Item 1\n• Item 2');
  });

  it('should handle rich_text_list with ordered style', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_list',
            style: 'ordered',
            elements: [
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: 'First' }],
              },
              {
                type: 'rich_text_section',
                elements: [{ type: 'text', text: 'Second' }],
              },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('1. First\n2. Second');
  });

  it('should handle multiple rich_text blocks', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'Block 1' }],
          },
        ],
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'Block 2' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Block 1\nBlock 2');
  });

  it('should skip non-rich_text blocks', () => {
    const blocks = [
      { type: 'divider' },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'Hello' }],
          },
        ],
      },
      { type: 'image', image_url: 'https://example.com/img.png' },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Hello');
  });

  it('should handle channel mentions', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'Check ' },
              { type: 'channel', channel_id: 'C123456' },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Check <#C123456>');
  });

  it('should handle broadcast mentions', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'broadcast', range: 'channel' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('@channel');
  });

  it('should handle unknown element types gracefully', () => {
    const blocks = [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              { type: 'text', text: 'Hello ' },
              { type: 'unknown_type', value: 'something' },
              { type: 'text', text: ' world' },
            ],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Hello  world');
  });

  it('should handle section block with text field', () => {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Section text content',
        },
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Section text content');
  });

  it('should handle header block', () => {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Header Title',
        },
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Header Title');
  });

  it('should handle mixed block types', () => {
    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Title' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: 'Description' },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: 'Details' }],
          },
        ],
      },
    ];
    expect(extractTextFromBlocks(blocks)).toBe('Title\nDescription\nDetails');
  });
});
