import { ReactElement } from 'react';
import './BasicTableHeading.css';


interface IBasicTableHeading {
  children: ReactElement | ReactElement[],
}

export const BasicTableHeading: React.FC<IBasicTableHeading> = ({ children }) => {
  return (
    <thead>
      {children}
    </thead>
  );
};
