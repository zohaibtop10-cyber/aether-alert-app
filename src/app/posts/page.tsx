

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Search, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

const postSchema = z.object({
  content: z.string().min(10, 'Post must be at least 10 characters long.').max(500, 'Post cannot exceed 500 characters.'),
});

function CreatePostForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  async function onSubmit(values: z.infer<typeof postSchema>) {
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
      content: values.content,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    const postsRef = collection(firestore, 'posts');
    addDoc(postsRef, postData)
      .then(() => {
        toast({
          title: 'Post Submitted!',
          description: 'Your post is now live.',
        });
        form.reset();
        setDialogOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: postsRef.path,
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
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Post</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts with the community..."
                  className="min-h-[150px]"
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

export default function PostsPage() {
    const { firestore } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useUser();

    const postsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null,
      [firestore]
    );

    const { data: posts, isLoading } = useCollection<any>(postsQuery);

    const filteredPosts = useMemo(() => {
        if (!posts) return [];
        return posts.filter(post => 
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [posts, searchQuery]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-3xl">Community Posts</h1>
                    <p className="text-muted-foreground">
                        A place for thoughts, updates, and discussions.
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
                            <DialogTitle>Create a New Post</DialogTitle>
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

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
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
                       <CardHeader className="flex flex-row items-center gap-4">
                            <UserCircle className="h-10 w-10 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg">{post.authorName}</CardTitle>
                                <CardDescription>
                                    {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                        </CardContent>
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
