import { useState } from "react";

export function useForceUpdate() {
  const [value, setValue] = useState(true);
  return () => setValue(!value);
}
