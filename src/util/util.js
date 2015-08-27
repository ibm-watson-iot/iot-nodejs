/**
 *****************************************************************************
 Copyright (c) 2014, 2015 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials
 are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at
 http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Tim-Daniel Jacobi - Initial Contribution
 *****************************************************************************
 *
 */
export function isString(value){
  return typeof value === 'string';
}

export function isDefined(value){
  return value !== undefined && value !== null;
}

export const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

export const isNode = new Function("try {return this===global;}catch(e){return false;}");
