/**
 * DashboardGrid.jsx
 * Renders the persisted dashboard layout as a 12-column CSS grid.
 * Each item's colSpan maps to a Tailwind col-span-* class.
 */
import WIDGET_REGISTRY from './DashboardWidgets';
import useDashboardLayoutStore from '../../stores/dashboardLayoutStore';

// Map colSpan number → Tailwind class (mobile full-width, md+ as configured)
const COL_SPAN_CLASS = {
  1:  'col-span-12 md:col-span-1',
  2:  'col-span-12 md:col-span-2',
  3:  'col-span-12 sm:col-span-6 md:col-span-3',
  4:  'col-span-12 sm:col-span-6 md:col-span-4',
  5:  'col-span-12 md:col-span-5',
  6:  'col-span-12 sm:col-span-6 md:col-span-6',
  7:  'col-span-12 md:col-span-7',
  8:  'col-span-12 md:col-span-8',
  9:  'col-span-12 md:col-span-9',
  10: 'col-span-12 md:col-span-10',
  11: 'col-span-12 md:col-span-11',
  12: 'col-span-12',
};

const DashboardGrid = () => {
  const items = useDashboardLayoutStore((s) => s.items);

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-auto">
      {items.map((item) => {
        const Widget = WIDGET_REGISTRY[item.type];
        if (!Widget) return null;
        const colClass = COL_SPAN_CLASS[item.colSpan] || 'col-span-12';
        return (
          <div key={item.id} className={colClass}>
            <Widget />
          </div>
        );
      })}
    </div>
  );
};

export default DashboardGrid;
