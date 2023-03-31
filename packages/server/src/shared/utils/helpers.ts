export const cleanTagsForSending = (obj) => {
  for (const propName in obj) {
    if (obj.hasOwnProperty(propName)) {
      const propValue = obj[propName];
      if (typeof propValue === 'string' || typeof propValue === 'number') {
        if (
          propValue === '' ||
          (typeof propValue === 'number' && isNaN(propValue))
        ) {
          delete obj[propName];
        }
      } else {
        delete obj[propName];
      }
    }
  }
  return obj;
};
