import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo and Tagline */}
          <div className="text-center md:text-left">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Paper<span className="text-orange-500">Vault</span>
            </Link>
            <p className="text-sm text-gray-600 mt-2">
              Paper-centric research workspace
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm">
            <Link
              href="/about"
              className="text-gray-600 hover:text-orange-500 transition-colors"
            >
              About
            </Link>
            <Link
              href="/library"
              className="text-gray-600 hover:text-orange-500 transition-colors"
            >
              Open App
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PaperVault. Built for research labs.
        </div>
      </div>
    </footer>
  );
}
