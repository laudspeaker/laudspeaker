const isObjectDeepEqual = (obj1: object, obj2: object) => {
  if (obj1 === null) return obj2 === null;

  for (const key of [...Object.keys(obj1), ...Object.keys(obj2)]) {
    if (typeof obj1[key] === 'object') {
      if (obj1[key] === undefined || typeof obj2[key] !== 'object')
        return false;

      if (!isObjectDeepEqual(obj1[key], obj2[key])) return false;
    } else {
      if (obj1[key] !== obj2[key]) return false;
    }
  }

  return true;
};

export default isObjectDeepEqual;
