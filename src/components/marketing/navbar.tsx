"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  const handleFeatureClick = () => {
    if (pathname === "/") {
      scrollToSection("features");
    } else {
      window.location.href = "/#features";
    }
  };

  const handleContactClick = () => {
    if (pathname === "/") {
      scrollToSection("contact");
    } else {
      window.location.href = "/#contact";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">
              Paper<span className="text-orange-500">Vault</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              About
            </Link>
            <button
              onClick={handleFeatureClick}
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Features
            </button>
            <button
              onClick={handleContactClick}
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Contact
            </button>
            <Link href="/demo/library">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              About
            </Link>
            <button
              onClick={handleFeatureClick}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Features
            </button>
            <button
              onClick={handleContactClick}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Contact
            </button>
            <div className="px-4 pt-2">
              <Link href="/demo/library" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
