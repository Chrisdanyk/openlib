import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface Author {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  coverImage: string | null;
  authors: Author[];
  publishedYear: number | null;
  availableCopies: number;
  totalCopies: number;
}

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        <div className="aspect-[3/4] relative overflow-hidden bg-muted">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {book.availableCopies > 0 ? (
            <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
              Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="absolute top-3 right-3">
              Unavailable
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {book.authors.map((a) => a.name).join(", ")}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{book.publishedYear || "Unknown"}</span>
            <span>•</span>
            <span>{book.availableCopies}/{book.totalCopies} copies</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


