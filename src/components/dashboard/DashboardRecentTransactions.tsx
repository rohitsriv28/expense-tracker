import GroupedTransactionList, { type GroupedTransaction } from "../expenses/GroupedTransactionList";

interface DashboardRecentTransactionsProps {
  transactions: GroupedTransaction[];
  onViewExpenses: () => void;
  onTransactionClick?: (transaction: GroupedTransaction) => void;
}

export default function DashboardRecentTransactions({
  transactions,
  onViewExpenses,
  onTransactionClick,
}: DashboardRecentTransactionsProps) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-label">Recent transactions</p>
          <h2 className="text-lg">Latest activity</h2>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onViewExpenses}
        >
          View all
        </button>
      </div>
      <GroupedTransactionList
        transactions={transactions}
        emptyTitle="No recent activity"
        emptyDescription="Add expenses or income to see the latest movement here."
        onTransactionClick={onTransactionClick}
      />
    </div>
  );
}
