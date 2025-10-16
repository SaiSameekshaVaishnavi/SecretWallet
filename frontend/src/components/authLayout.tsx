import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-3xl font-semibold mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
