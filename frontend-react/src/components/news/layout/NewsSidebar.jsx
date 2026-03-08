/**
 * NewsSidebar.jsx
 * Renders sidebar blocks from newsLayoutStore (sidebarBlocks).
 * Block order and presence is fully controlled from the layout editor.
 */
import useNewsLayoutStore from '../../../stores/newsLayoutStore';
import { BLOCK_REGISTRY } from '../public/NewsBlocks';

const NewsSidebar = () => {
  const { sidebarBlocks } = useNewsLayoutStore();

  return (
    <aside className="space-y-4">
      {sidebarBlocks.map((block) => {
        const Component = BLOCK_REGISTRY[block.type];
        if (!Component) return null;
        return <Component key={block.id} config={block.config || {}} />;
      })}
    </aside>
  );
};

export default NewsSidebar;
