'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const blogPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  content: z.string().min(20, 'Content must be at least 20 characters long.'),
});

function CreatePostForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof blogPostSchema>>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: { title: '', content: '' },
  });

  async function onSubmit(values: z.infer<typeof blogPostSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a post.',
      });
      return;
    }
    setIsSubmitting(true);

    const postData = {
      title: values.title,
      content: values.content,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    const blogRef = collection(firestore, 'blogPosts');
    addDoc(blogRef, postData)
      .then(() => {
        toast({
          title: 'Blog Post Submitted!',
          description: 'Your post is now live.',
        });
        form.reset();
        setDialogOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: blogRef.path,
          operation: 'create',
          requestResourceData: postData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Post Title</FormLabel>
              <FormControl>
                <Input placeholder="My Thoughts on Renewable Energy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your blog post here..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Create Post'}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function BlogPage() {
    const { firestore } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useUser();

    const postsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'blogPosts'), orderBy('createdAt', 'desc')) : null,
      [firestore]
    );

    const { data: posts, isLoading } = useCollection<any>(postsQuery);

    const filteredPosts = useMemo(() => {
        if (!posts) return [];
        return posts.filter(post => 
            post.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [posts, searchQuery]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-3xl">Community Blog</h1>
                    <p className="text-muted-foreground">
                        Share your thoughts, updates, and ideas with the community.
                    </p>
                </div>
                {user && 
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create a Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Blog Post</DialogTitle>
                            <DialogDescription>
                                Share your latest thoughts and engage with other climate warriors.
                            </DialogDescription>
                        </DialogHeader>
                        <CreatePostForm setDialogOpen={setIsDialogOpen} />
                    </DialogContent>
                </Dialog>
                }
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Filter posts..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && filteredPosts.map(post => (
                    <Card key={post.id}>
                        <CardHeader>
                            <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                            <CardDescription>
                                By {post.authorName} • {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="line-clamp-3 text-sm text-muted-foreground">{post.content}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm">Read More</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {!isLoading && filteredPosts.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No posts found.</p>
                    <p className="text-sm">{searchQuery ? `Try adjusting your filter.` : 'Be the first to create a post!'}</p>
                </div>
            )}
        </div>
    );
}
