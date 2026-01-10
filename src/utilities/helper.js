 export const toBoolean = (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  };

export const toNumberOrUndefined = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };