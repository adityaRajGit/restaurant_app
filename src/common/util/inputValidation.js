export function validateAdminSignUpBody(input) {
  let isValid = true;
  let errors = [];
  if (!input) {
    isValid = false;
    errors.push("expecting admin body");
  } else if (!input.contact_email) {
    isValid = false;
    errors.push("email cannot be empty");
  } else if (!input.password) {
    isValid = false;
    errors.push("password cannot be empty");
  }
  return {
    isValid,
    errors,
  };
}
export function validateCustomerOtpValidateBody(input) {
  let isValid = true;
  let errors = [];
  if (!input) {
    isValid = false;
    errors.push("expecting customer body");
  } else if (!input.otp) {
    isValid = false;
    errors.push("otp is required");
  }
  return {
    isValid,
    errors,
  };
}
export function validateCustomerLoginBody(input) {
  let isValid = true;
  let errors = [];
  if (!input) {
    isValid = false;
    errors.push("Expecting customer body");
  } else if (!input.contact_email) {
    isValid = false;
    errors.push("Email cannot be empty");
  } else if (!input.password) {
    isValid = false;
    errors.push("password cannot be empty");
  }
  return {
    isValid,
    errors,
  };
}

export function validateCustomerSignUpBody(input) {
  let isValid = true;
  let errors = [];
  if (!input) {
    isValid = false;
    errors.push("Expecting customer body");
  } else if (!input.contact_email) {
    isValid = false;
    errors.push("Email cannot be empty");
  }
  return {
    isValid,
    errors,
  };
}
