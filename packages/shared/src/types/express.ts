export {};

declare global {
  namespace Express {
    export interface Request {
      wantsJson: () => boolean;
    }
  }
}