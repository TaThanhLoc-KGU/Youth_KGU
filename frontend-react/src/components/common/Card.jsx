import clsx from 'clsx';

const Card = ({ children, className, padding = true, hover = false }) => {
  return (
    <div
      className={clsx(
        'card bg-base-100 shadow-sm border border-base-300',
        hover && 'transition-shadow hover:shadow-lg',
        className
      )}
    >
      {padding ? <div className="card-body">{children}</div> : children}
    </div>
  );
};

const CardHeader = ({ children, className, action }) => {
  return (
    <div className={clsx('card-title border-b border-base-300 pb-4', className)}>
      <div className="flex items-center justify-between w-full">
        <div>{children}</div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

const CardBody = ({ children, className }) => {
  return <div className={clsx('card-body', className)}>{children}</div>;
};

const CardFooter = ({ children, className }) => {
  return (
    <div className={clsx('border-t border-base-300 px-6 py-4', className)}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
