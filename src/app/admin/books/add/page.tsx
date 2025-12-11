"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MultiSelect } from "~/components/ui/multi-select";
import { AppLayout } from "~/components/layout/AppLayout";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isbn: z.string().optional(),
  publishedYear: z.coerce.number().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  authorIds: z.array(z.string()).min(1, "Select at least one author"),
  categoryIds: z.array(z.string()),
});

type BookForm = z.infer<typeof bookSchema>;

export default function AddBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: authorsData } = api.author.getAll.useQuery();
  const { data: categoriesData } = api.category.getAll.useQuery();
  
  const authors = authorsData?.items ?? [];
  const categories = categoriesData?.items ?? [];

  const createBook = api.book.create.useMutation({
    onSuccess: () => {
      toast.success("Book added!", {
        description: "The book has been added to your library.",
      });
      router.push("/admin/books");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to add book. Please try again.",
      });
    },
  });

  const form = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      isbn: "",
      publishedYear: undefined,
      coverImage: "",
      authorIds: [],
      categoryIds: [],
    },
  });

  const onSubmit = async (data: BookForm) => {
    setLoading(true);
    try {
      await createBook.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        isbn: data.isbn || undefined,
        publishedYear: data.publishedYear,
        coverImage: data.coverImage || undefined,
        authorIds: data.authorIds,
        categoryIds: data.categoryIds,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/books">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <PageHeader title="Add New Book" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter book description"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isbn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ISBN</FormLabel>
                        <FormControl>
                          <Input placeholder="0-123-45678-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publishedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Published Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2024"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/cover.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Authors & Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="authorIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authors *</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={authors.map((a) => ({ label: a.name, value: a.id }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select authors..."
                          searchPlaceholder="Search authors..."
                          emptyMessage="No authors found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={categories.map((c) => ({ label: c.name, value: c.id }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select categories..."
                          searchPlaceholder="Search categories..."
                          emptyMessage="No categories found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/books">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {loading ? "Adding..." : "Add Book"}
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

