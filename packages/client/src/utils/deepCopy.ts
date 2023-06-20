const deepCopy = <T>(obj: T): T => {
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.slice().map((item) => deepCopy(item)) as unknown as T;
    }

    const newObj: Record<string | number | symbol, unknown> = {
      ...(obj || {}),
    };

    for (const key of Object.keys(newObj)) {
      newObj[key] = deepCopy(newObj[key]);
    }

    return newObj as T;
  }

  return obj;
};

export default deepCopy;
