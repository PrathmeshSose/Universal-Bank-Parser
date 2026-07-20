import "../styles/DataTable.css";

function DataTable({ transactions, onChange }) {
  const tableData = transactions || [];

  if (!transactions || transactions.length === 0) {
    return (
      <div className="table-container empty-state">
        <h3>Extracted Transactions</h3>
        <p>No transactions extracted yet. Upload a PDF to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h3>Extracted Transactions</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={item.Date || ""}
                    onChange={(e) =>
                      onChange(index, "Date", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    value={item.Description || ""}
                    onChange={(e) =>
                      onChange(index, "Description", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    value={item.Debit || ""}
                    onChange={(e) =>
                      onChange(index, "Debit", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    value={item.Credit || ""}
                    onChange={(e) =>
                      onChange(index, "Credit", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    value={item.Balance || ""}
                    onChange={(e) =>
                      onChange(index, "Balance", e.target.value)
                    }
                  />
                </td>

                <td>
                  <span className="status valid">✔ Valid</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;