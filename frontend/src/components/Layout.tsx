import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../services/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/staff", label: "Personel Paneli" },
    { path: "/admin", label: "Yönetici Paneli" },
  ];

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col !bggradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="!bgwhite shadow-lg w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Nav container - Adjust flex direction for mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-2 sm:py-0">
            {/* Logo and Title Section - Allow stacking */}
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex items-center justify-center">
                <img
                  src="/react.png"
                  alt="Kurban Takip Logo"
                  className="h-10 w-10 mr-2"
                />
              </div>
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                  Kurban Takip
                </h1>
              </div>
            </div>





            {/* Logout Button - Center on mobile, align right on larger */}
            <div className="flex items-center mt-2 sm:mt-0 sm:ml-6">
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white !bgred-600 rounded-md hover:!bgred-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content - Added padding for mobile */}
      <main className="flex-grow max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer - Remains the same, already simple */}
      <footer className="!bgwhite shadow-lg mt-auto w-full">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Kurban Takip. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
