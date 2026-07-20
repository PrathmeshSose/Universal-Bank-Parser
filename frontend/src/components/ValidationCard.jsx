import "../styles/ValidationCard.css";

function ValidationCard({ transactions }) {
  const total = transactions.length;

  const valid = transactions.filter(
    (item) => item.status === "Valid" || item.status === undefined
  ).length;

  const invalid = total - valid;

  return (
    <div className="validation-card">
      <h3>Validation Summary</h3>

      <div className="validation-item">
        <span>Total Transactions</span>
        <strong>{total}</strong>
      </div>

      <div className="validation-item">
        <span>Valid</span>
        <strong style={{ color: "green" }}>{valid}</strong>
      </div>

      <div className="validation-item">
        <span>Invalid</span>
        <strong style={{ color: "red" }}>{invalid}</strong>
      </div>

      {total > 0 ? (
        <p className="success-message">
          ✅ Data extraction completed successfully.
        </p>
      ) : (
        <p>No transactions available.</p>
      )}
    </div>
  );
}

export default ValidationCard;