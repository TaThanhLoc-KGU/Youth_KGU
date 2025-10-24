import clsx from 'clsx';

const Card = ({ children, className, padding = true, hover = false }) => {
  return (
    <div
      className={clsx(
        'card',
        padding && 'card-body',
        hover && 'transition-shadow hover:shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, action }) => {
  return (
    <div className={clsx('card-header', className)}>
      <div className="flex items-center justify-between">
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
    <div className={clsx('border-t border-gray-200 px-6 py-4', className)}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
