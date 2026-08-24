import { useState, useEffect } from "react";
import payrollService from "../../../../services/payrollService";
import { normalizeRecord } from "../utils";

const buildMonthLabels = () =>
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  });

export const usePayrollHistory = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const monthLabels = buildMonthLabels();
        const results = await Promise.allSettled(
          monthLabels.map((m) =>
            payrollService.getPayrollData({ month: m, limit: 500 }),
          ),
        );

        if (cancelled) return;

        const records = [];
        results.forEach((res, idx) => {
          if (res.status !== "fulfilled") return;
          const month = monthLabels[idx];
          (res.value?.data?.employees || []).forEach((emp) => {
            if (!emp.payrollRecordId) return;
            records.push(normalizeRecord(emp, month));
          });
        });

        setAllRecords(records);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { allRecords, loading, error };
};
