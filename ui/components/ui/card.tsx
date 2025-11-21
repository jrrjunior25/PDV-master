import React from 'react';

export const Card = ({ children, className }: any) => <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>{children}</div>;
export const CardHeader = ({ children, className }: any) => <div className={`p-6 pb-4 ${className}`}>{children}</div>;
export const CardTitle = ({ children, className }: any) => <h3 className={`text-lg font-bold text-slate-900 ${className}`}>{children}</h3>;
export const CardContent = ({ children, className }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
