import Link from "next/link";
import { Library } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Open Library</h3>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Discover books. Explore authors. Borrow instantly.
            </p>
          </div>

          {/* Browse */}
          <div className="space-y-4">
            <h4 className="font-semibold">Browse</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/books" className="hover:text-primary transition-colors">
                All Books
              </Link>
              <Link href="/authors" className="hover:text-primary transition-colors">
                Authors
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-semibold">Account</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/register" className="hover:text-primary transition-colors">
                Register
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>support@openlibrary.com</p>
              <p>123 Library Lane</p>
              <p>Booktown, BK 12345</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Open Library. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


