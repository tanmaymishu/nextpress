import { format } from 'date-fns';

export type NumericQueryString = number | undefined;

export const toTimeStamp = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export const env = <T>(...args: any[]): T => {
  if (args[1] != undefined) {
    process.env[args[0]] = args[1];
  }
  return process.env[args[0]] as any;
};

export const JSON_REQ = 'application/json';