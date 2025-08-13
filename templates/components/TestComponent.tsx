import React from 'react';

interface TestComponentProps {
  title: string;
  description?: string;
}

export const TestComponent: React.FC<TestComponentProps> = ({
  title,
  description
}) => {
  return (
    <div className="test-component">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
};
