import { ReactElement } from 'react';
import './BasicTableBody.css';


interface IBasicTableBody {
  children: ReactElement | ReactElement[],
}

export const BasicTableBody: React.FC<IBasicTableBody> = ({ children }) => {
  return (
    <tbody>
      {children}
    </tbody>
  );
};
