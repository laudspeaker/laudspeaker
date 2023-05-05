const recursivelyUpdateObject = (
  obj: Record<string, unknown>,
  handleUpdate: (item: unknown, type: string) => unknown
) => {
  if (!obj) return;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      recursivelyUpdateObject(
        obj[key] as Record<string, unknown>,
        handleUpdate
      );
    } else {
      obj[key] = handleUpdate(obj[key], typeof obj[key]);
    }
  }
};

export default recursivelyUpdateObject;
