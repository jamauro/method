export const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key]) result[key] = obj[key];
  }

  return result;
};
