import { Node, mergeAttributes } from '@tiptap/core';

/**
 * FigureExtension - Node extension cho <figure><img><figcaption></figcaption></figure>
 * Cho phép chèn ảnh kèm chú thích có thể chỉnh sửa trực tiếp.
 */
export const FigureExtension = Node.create({
  name: 'figure',
  group: 'block',
  content: 'image figcaption',
  draggable: true,

  parseHTML() {
    return [
      { tag: 'figure' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes), 0];
  },
});

export const FigcaptionExtension = Node.create({
  name: 'figcaption',
  content: 'inline*',
  selectable: false,
  draggable: false,

  parseHTML() {
    return [
      { tag: 'figcaption' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes), 0];
  },
});
