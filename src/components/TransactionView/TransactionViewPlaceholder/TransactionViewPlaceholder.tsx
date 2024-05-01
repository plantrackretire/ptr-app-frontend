import '../TransactionView.css';
import './TransactionViewPlaceholder.css';

export const TransactionViewPlaceholder: React.FC = () => {
  return (
    <div className="transaction-view--loading placeholder">
      <h2>Loading</h2>
    </div>
  );
};