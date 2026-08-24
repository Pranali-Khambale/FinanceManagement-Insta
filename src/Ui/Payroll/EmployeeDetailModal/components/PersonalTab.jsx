import React from "react";
import { Input, SectionTitle, Grid } from "./Primitives";

const PersonalTab = ({ form, handleChange }) => (
  <>
    <SectionTitle>Personal Info</SectionTitle>
    <Grid>
      <Input
        label="Full Name"
        name="name"
        value={form.name}
        onChange={handleChange}
      />
      <Input
        label="Employee ID"
        name="employeeId"
        value={form.employeeId}
        onChange={handleChange}
        readOnly
        hint="Auto-assigned — cannot be changed"
      />
      <Input
        label="Designation"
        name="designation"
        value={form.designation}
        onChange={handleChange}
      />
      <Input
        label="Department"
        name="department"
        value={form.department}
        onChange={handleChange}
      />
      <Input
        label="Joining Date"
        name="joiningDate"
        value={form.joiningDate}
        onChange={handleChange}
        type="date"
      />
      <Input
        label="Current Location"
        name="currentLocation"
        value={form.currentLocation}
        onChange={handleChange}
      />
      <Input
        label="Employment Type"
        name="employmentType"
        value={form.employmentType}
        onChange={handleChange}
      />
      <Input
        label="Project"
        name="project"
        value={form.project}
        onChange={handleChange}
      />
    </Grid>

    <SectionTitle>Bank Details</SectionTitle>
    <Grid>
      <Input
        label="Bank Name"
        name="bankName"
        value={form.bankName}
        onChange={handleChange}
      />
      <Input
        label="A/C Number"
        name="accountNumber"
        value={form.accountNumber || form.bankAccountNo}
        onChange={handleChange}
      />
      <Input
        label="IFSC Code"
        name="ifscCode"
        value={form.ifscCode}
        onChange={handleChange}
      />
      <Input
        label="Bank Branch"
        name="bankBranch"
        value={form.bankBranch}
        onChange={handleChange}
      />
    </Grid>

    <SectionTitle>Statutory Info</SectionTitle>
    <Grid>
      <Input
        label="PAN No"
        name="panNo"
        value={form.panNo}
        onChange={handleChange}
      />
      <Input
        label="Aadhar No"
        name="aadharNo"
        value={form.aadharNo}
        onChange={handleChange}
      />
      <Input
        label="EPF No"
        name="epfNo"
        value={form.epfNo}
        onChange={handleChange}
      />
      <Input
        label="ESIC No"
        name="esicNo"
        value={form.esicNo}
        onChange={handleChange}
      />
      <Input
        label="UAN No"
        name="uanNo"
        value={form.uanNo}
        onChange={handleChange}
      />
    </Grid>
  </>
);

export default PersonalTab;
