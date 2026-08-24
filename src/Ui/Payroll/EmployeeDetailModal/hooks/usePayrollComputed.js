import { useMemo } from "react";
import {
  n,
  pfFromBasic,
  employerPfFromBasic,
  gratuityFromBasic,
} from "../utils";

export const usePayrollComputed = (
  form,
  resolvedEmpPf,
  resolvedCoEmpPf,
  resolvedPt,
  resolvedGratuity,
) =>
  useMemo(() => {
    const monthDays = n(form.monthDays) || 30;
    const pDays = form.pDays != null ? n(form.pDays) : monthDays;
    const ratio = monthDays > 0 ? pDays / monthDays : 1;

    const basic = n(form.basic);
    const hra = n(form.hra);
    const orgAllow = n(form.organisationAllowance);
    const perfPay = n(form.performancePay);
    const tds = n(form.tds);
    const otherDed = n(form.otherDeduction);
    const advDed = n(form.advanceDeduction);
    const advAdd = n(form.advanceAddition);

    const empPfDed = resolvedEmpPf != null ? resolvedEmpPf : pfFromBasic(basic);
    const coPfDed =
      resolvedCoEmpPf != null ? resolvedCoEmpPf : employerPfFromBasic(basic);
    const pt = resolvedPt != null ? resolvedPt : 200;
    const gratuity =
      resolvedGratuity != null ? resolvedGratuity : gratuityFromBasic(basic);

    const gross = basic + hra + orgAllow;
    const grossD = gross * ratio;
    const perfD = perfPay * ratio;
    const totalPf = empPfDed + coPfDed;
    const totalDed =
      empPfDed + coPfDed + pt + tds + otherDed + advDed + gratuity;
    const net = grossD - totalDed + advAdd;
    const totalEarn = net + perfD;

    return {
      gross,
      grossD,
      perfD,
      empPfDed,
      coPfDed,
      totalPf,
      pt,
      gratuity,
      totalDed,
      net,
      totalEarn,
      ratio,
    };
  }, [form, resolvedEmpPf, resolvedCoEmpPf, resolvedPt, resolvedGratuity]);
