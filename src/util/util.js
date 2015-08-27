export function isString(value){
  return typeof value === 'string';
}

export function isDefined(value){
  return value !== undefined && value !== null;
}

export const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

export const isNode = new Function("try {return this===global;}catch(e){return false;}");
