"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AppLayout } from "~/components/layout/AppLayout";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
});

type AuthorForm = z.infer<typeof authorSchema>;

export default function AddAuthorPage() {
  const router = useRouter();

  const createAuthor = api.author.create.useMutation({
    onSuccess: () => {
      toast.success("Author added!", {
        description: "The author has been added.",
      });
      router.push("/admin/authors");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to add author. Please try again.",
      });
    },
  });

  const form = useForm<AuthorForm>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: "",
      bio: "",
    },
  });

  const onSubmit = async (data: AuthorForm) => {
    await createAuthor.mutateAsync({
      name: data.name,
      bio: data.bio || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/authors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <PageHeader title="Add New Author" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Author Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter author name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter author biography"
                          rows={4}
                          {...field}
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
                <Link href="/admin/authors">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createAuthor.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Add Author
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

