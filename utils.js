export const isObject = o => o && o.constructor === Object;

export const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key]) result[key] = obj[key];
  }

  return result;
};
