// Local Express type extensions for the API
declare namespace Express {
  export interface Request {
    wantsJson: () => boolean;
  }
}