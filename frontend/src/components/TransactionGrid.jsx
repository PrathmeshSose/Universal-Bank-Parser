import React from "react";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function formatAmount(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TransactionGrid({
  transactions = [],
  onChange,
  onDelete,
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[1100px] w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              #
            </th>

            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Date
            </th>

            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Description
            </th>

            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Previous Balance
            </th>

            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Debit
            </th>

            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Credit
            </th>

            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Current Balance
            </th>

            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Status
            </th>

            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction, index) => {
            const flagged = Boolean(transaction.flagged);

            return (
              <tr
                key={transaction.id || index}
                className={`border-b border-slate-100 transition hover:bg-slate-50 ${flagged ? "bg-red-50/40" : "bg-white"
                  }`}
              >
                {/* LINE NUMBER */}
                <td className="px-4 py-3 align-middle">
                  <span className="font-bold text-slate-500">
                    {transaction.lineNo || index + 1}
                  </span>
                </td>

                {/* DATE */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={transaction.date || ""}
                    onChange={(event) =>
                      onChange(
                        transaction.id,
                        "date",
                        event.target.value
                      )
                    }
                    className="w-[125px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="YYYY-MM-DD"
                  />
                </td>

                {/* DESCRIPTION */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={transaction.description || ""}
                    onChange={(event) =>
                      onChange(
                        transaction.id,
                        "description",
                        event.target.value
                      )
                    }
                    className="w-[250px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Transaction description"
                  />
                </td>

                {/* PREVIOUS BALANCE */}
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={transaction.prevBalance ?? 0}
                    onChange={(event) =>
                      onChange(
                        transaction.id,
                        "prevBalance",
                        event.target.value
                      )
                    }
                    className="w-[130px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </td>

                {/* DEBIT */}
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={transaction.debit ?? 0}
                    onChange={(event) =>
                      onChange(
                        transaction.id,
                        "debit",
                        event.target.value
                      )
                    }
                    className="w-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </td>

                {/* CREDIT */}
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={transaction.credit ?? 0}
                    onChange={(event) =>
                      onChange(
                        transaction.id,
                        "credit",
                        event.target.value
                      )
                    }
                    className="w-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </td>

                {/* CURRENT BALANCE */}
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={transaction.currBalance ?? 0}
                    onChange={(event) =>
                      onChange(
                        transaction.id,
                        "currBalance",
                        event.target.value
                      )
                    }
                    className={`w-[130px] rounded-lg border px-3 py-2 text-right text-xs font-semibold outline-none transition focus:ring-2 ${flagged
                        ? "border-red-200 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 bg-white text-slate-700 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                  />

                  <div className="mt-1 text-[10px] text-slate-400">
  ₹{formatAmount(transaction.currBalance)}
   </div>
                </td>

                {/* STATUS */}
                <td className="px-4 py-3 text-center">
                  {flagged ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                      <AlertTriangle size={13} />
                      Flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      <CheckCircle2 size={13} />
                      Valid
                    </span>
                  )}
                </td>

                {/* DELETE */}
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      onDelete(transaction.id)
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    title="Delete transaction"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {transactions.length === 0 && (
        <div className="flex min-h-[220px] items-center justify-center">
          <p className="text-sm text-slate-400">
            No transactions available.
          </p>
        </div>
      )}
    </div>
  );
}

export default TransactionGrid;