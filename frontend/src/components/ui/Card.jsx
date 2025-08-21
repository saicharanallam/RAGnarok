import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default', 
  hoverable = false,
  onClick,
  title,
  subtitle,
  icon
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    hoverable ? 'card--hoverable' : '',
    onClick ? 'card--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || icon) && (
        <div className="card__header">
          {icon && <div className="card__icon">{icon}</div>}
          <div className="card__title-section">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="card__content">
        {children}
      </div>
    </div>
  );
};

export default Card;
