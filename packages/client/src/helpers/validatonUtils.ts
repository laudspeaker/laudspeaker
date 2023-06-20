import { ISignUpForm } from "../reducers/auth.reducer";
// export const validateMobile = (value:string) => value.length === 10;
export const validatePassword = (value: string) =>
  value.length >= 6 && value.length <= 15;
export const validateEmail = (value: string) =>
  /^[^ ]+@[^ ]+\.[a-z]{2,3}$/.test(value);
export const validateFirstName = (value: string) => value.length >= 3;
export const validateLastName = (value: string) => value.length >= 1;
export const validatePasswordField = (values: ISignUpForm) => {
  const errors = {};
  let valid = true;
  if (
    !values.password ||
    !values.confirmPassword ||
    //   || !values.currentPassword
    !validatePassword(values.password) ||
    !validatePassword(values.confirmPassword) ||
    //   || !validatePassword(values.currentPassword)
    values.password !== values.confirmPassword
  ) {
    valid = false;
  }

  return {
    valid,
    errors,
  };
};
