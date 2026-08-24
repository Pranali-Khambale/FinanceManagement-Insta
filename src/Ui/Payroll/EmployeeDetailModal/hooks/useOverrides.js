import { useState, useEffect } from "react";
import { pfFromBasic, employerPfFromBasic, gratuityFromBasic } from "../utils";

export const useOverrides = (employee) => {
  const [pfOverride, setPfOverride] = useState(false);
  const [empPf, setEmpPf] = useState("");
  const [coEmpPf, setCoEmpPf] = useState("");
  const [ptOverride, setPtOverride] = useState(false);
  const [ptVal, setPtVal] = useState("");
  const [gratuityOverride, setGratuityOverride] = useState(false);
  const [gratuityVal, setGratuityVal] = useState("");

  useEffect(() => {
    if (!employee) return;
    if (employee.pfDeduction != null) {
      setPfOverride(true);
      setEmpPf(String(employee.pfDeduction));
      setCoEmpPf(
        String(employee.employerPfContribution ?? employee.pfDeduction),
      );
    }
    if (employee.pt != null) {
      setPtOverride(true);
      setPtVal(String(employee.pt));
    }
    if (employee.gratuity != null) {
      setGratuityOverride(true);
      setGratuityVal(String(employee.gratuity));
    }
  }, [employee]);

  const getResolvedEmpPf = (form) =>
    pfOverride && empPf !== ""
      ? Number(empPf)
      : form.pfDeduction != null
        ? Number(form.pfDeduction)
        : null;

  const getResolvedCoEmpPf = (form) =>
    pfOverride && coEmpPf !== ""
      ? Number(coEmpPf)
      : form.employerPfContribution != null
        ? Number(form.employerPfContribution)
        : null;

  const getResolvedPt = (form) =>
    ptOverride && ptVal !== ""
      ? Number(ptVal)
      : form.pt != null
        ? Number(form.pt)
        : null;

  const getResolvedGratuity = (form) =>
    gratuityOverride && gratuityVal !== ""
      ? Number(gratuityVal)
      : form.gratuity != null
        ? Number(form.gratuity)
        : null;

  const handlePfOverrideToggle = (checked, basic) => {
    setPfOverride(checked);
    if (!checked) {
      setEmpPf("");
      setCoEmpPf("");
    } else {
      setEmpPf(String(pfFromBasic(basic)));
      setCoEmpPf(String(employerPfFromBasic(basic)));
    }
  };

  const handlePtOverrideToggle = (checked) => {
    setPtOverride(checked);
    if (!checked) setPtVal("");
    else setPtVal("200");
  };

  const handleGratuityOverrideToggle = (checked, basic) => {
    setGratuityOverride(checked);
    if (!checked) setGratuityVal("");
    else setGratuityVal(String(gratuityFromBasic(basic)));
  };

  const buildPayload = (form) => ({
    ...form,
    pfDeduction: pfOverride && empPf !== "" ? Number(empPf) : null,
    employerPfContribution:
      pfOverride && coEmpPf !== "" ? Number(coEmpPf) : null,
    pt: ptOverride && ptVal !== "" ? Number(ptVal) : null,
    gratuity:
      gratuityOverride && gratuityVal !== "" ? Number(gratuityVal) : null,
  });

  return {
    pfOverride,
    empPf,
    setEmpPf,
    coEmpPf,
    setCoEmpPf,
    ptOverride,
    ptVal,
    setPtVal,
    gratuityOverride,
    gratuityVal,
    setGratuityVal,
    handlePfOverrideToggle,
    handlePtOverrideToggle,
    handleGratuityOverrideToggle,
    getResolvedEmpPf,
    getResolvedCoEmpPf,
    getResolvedPt,
    getResolvedGratuity,
    buildPayload,
  };
};
