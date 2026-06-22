import clsx from 'clsx';

const CARD_SHADOW = {
  boxShadow: '0 1px 4px 0 rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)',
};

const Card = ({ children, className, padding = true, hover = false }) => (
  <div
    className={clsx(
      'rounded-2xl bg-white',
      padding && 'p-5',
      hover && 'transition-shadow hover:shadow-md cursor-pointer',
      className
    )}
    style={CARD_SHADOW}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className, action }) => (
  <div className={clsx('flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100', className)}>
    <div>{children}</div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

const CardBody = ({ children, className }) => (
  <div className={clsx('p-5', className)}>{children}</div>
);

const CardFooter = ({ children, className }) => (
  <div className={clsx('px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 rounded-b-2xl', className)}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
