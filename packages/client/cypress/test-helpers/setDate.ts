export default (input: HTMLInputElement, value: string) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  if (!nativeInputValueSetter) return;
  nativeInputValueSetter.call(input, value);

  const event = new Event("input", { bubbles: true });
  input.dispatchEvent(event);
};
