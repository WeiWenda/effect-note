import keyDefinitions, { Action } from '../keyDefinitions';

keyDefinitions.registerAction(new Action(
  'indent-row',
  'Indent row right',
  async function({ session }) {
    await session.indent();
  },
));
// NOTE: this matches block indent behavior, in visual line
keyDefinitions.registerAction(new Action(
  'visual-line-indent',
  'Indent blocks right',
  async function({ session, visual_line }) {
    if (visual_line == null) {
      throw new Error('Visual_line mode arguments missing');
    }
    await session.indentBlocks(visual_line.start, visual_line.num_rows);
    await session.setMode('NORMAL');
  },
));

keyDefinitions.registerAction(new Action(
  'unindent-row',
  'Unindent row',
  async function({ session }) {
    await session.unindent();
  },
));

// NOTE: this matches block indent behavior, in visual line
keyDefinitions.registerAction(new Action(
  'visual-line-unindent',
  'Unindent blocks',
  async function({ session, visual_line }) {
    if (visual_line == null) {
      throw new Error('Visual_line mode arguments missing');
    }
    await session.unindentBlocks(visual_line.start, visual_line.num_rows);
    await session.setMode('NORMAL');
  }
));

keyDefinitions.registerAction(new Action(
  'select-indent',
  'Indent select blocks right',
  async function({ session, repeat }) {
    if (session.selecting && session.getAnchor() !== null && !session.cursor.path.is(session.anchor.path)) {
      const [parent, index1, index2] = await session.getVisualLineSelections();
      const children = await session.document.getChildren(parent);
      await session.indentBlocks(children[index1], index2 - index1 + 1);
    } else {
      await session.indentBlocks(session.cursor.path, repeat);
    }
  },
));

keyDefinitions.registerAction(new Action(
  'select-unindent',
  'Move select block left',
  async function({ session, repeat }) {
    if (session.getAnchor() !== null && !session.cursor.path.is(session.anchor.path)) {
      const [parent, index1, index2] = await session.getVisualLineSelections();
      const children = await session.document.getChildren(parent);
      await session.unindentBlocks(children[index1], index2 - index1 + 1);
    } else {
      await session.unindentBlocks(session.cursor.path, repeat);
    }
  },
));

keyDefinitions.registerAction(new Action(
  'indent-blocks',
  'Indent blocks right',
  async function({ session, repeat }) {
    await session.indentBlocks(session.cursor.path, repeat);
  },
));

keyDefinitions.registerAction(new Action(
  'unindent-blocks',
  'Move block left',
  async function({ session, repeat }) {
    await session.unindentBlocks(session.cursor.path, repeat);
  },
));

keyDefinitions.registerAction(new Action(
  'swap-block-down',
  'Move block down',
  async function({ session }) {
    await session.swapDown();
  },
));

keyDefinitions.registerAction(new Action(
  'swap-block-up',
  'Move block up',
  async function({ session }) {
    await session.swapUp();
  },
));
