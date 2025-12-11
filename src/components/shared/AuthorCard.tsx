import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface Author {
  id: string;
  name: string;
  bio?: string | null;
}

interface AuthorCardProps {
  author: Author;
  bookCount?: number;
}

// Generate avatar URL based on author name
const getAuthorAvatarUrl = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200&bold=true&color=fff`;
};

export function AuthorCard({ author, bookCount }: AuthorCardProps) {
  const avatarUrl = getAuthorAvatarUrl(author.name);
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/authors/${author.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 h-full overflow-hidden">
        <CardContent className="p-0">
          {/* Author Image/Avatar */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={avatarUrl} alt={author.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Author Info */}
          <div className="p-6 text-center space-y-3">
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {author.name}
              </h3>
              {author.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {author.bio}
                </p>
              )}
            </div>
            
            {bookCount !== undefined && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                <BookOpen className="w-4 h-4" />
                <span>
                  {bookCount} book{bookCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


