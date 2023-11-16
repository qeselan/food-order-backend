import { NextFunction, Request, Response } from 'express';

export const ErrorHandling = (err, req, res, next) => {
  res.status(500).json({
    msg: err.message,
    success: false
  });
};
