export default <T, K>(arr: T[], keyCallback: (item: T) => K): T[] => {
  const distinctMap = new Map<K, T>();

  for (const item of arr) {
    const key = keyCallback(item);

    if (distinctMap.has(key)) continue;

    distinctMap.set(key, item);
  }

  return Array.from(distinctMap.values());
};
