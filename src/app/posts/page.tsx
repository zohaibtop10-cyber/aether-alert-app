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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Search, UserCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const categories = ["Discussion", "Announcement", "Resource", "Question"];

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.').max(100, 'Title cannot exceed 100 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.').max(2000, 'Description cannot exceed 2000 characters.'),
  category: z.string().nonempty({ message: 'Please select a category.' }),
  documentUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

function CreatePostForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: '', description: '', category: '', documentUrl: '' },
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
      ...values,
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What's the title of your post?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  placeholder="Share your thoughts with the community..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="documentUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document URL (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="https://example.com/document.pdf" className="pl-10" {...field} />
                </div>
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
    const [selectedCategory, setSelectedCategory] = useState('All');
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
            (selectedCategory === 'All' || post.category === selectedCategory) &&
            (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [posts, searchQuery, selectedCategory]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-3xl">Community Hub</h1>
                    <p className="text-muted-foreground">
                        Share ideas, ask questions, and connect with others.
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
                    <DialogContent className="sm:max-w-xl">
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
            
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Filter posts by keyword..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-1 lg:grid-cols-2"
            >
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-6 w-1/4" />
                        </CardFooter>
                    </Card>
                ))}

                {!isLoading && filteredPosts.map(post => (
                    <motion.div key={post.id} variants={itemVariants}>
                        <Card className="flex flex-col h-full hover:-translate-y-1">
                            <CardHeader>
                               <div className="flex justify-between items-start gap-2">
                                     <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                                     <Badge variant="outline">{post.category}</Badge>
                               </div>
                               <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                                     <UserCircle className="h-5 w-5" />
                                     <span>{post.authorName}</span>
                                     <span>·</span>
                                     <span>{post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}</span>
                               </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">{post.description}</p>
                            </CardContent>
                            <CardFooter>
                                {post.documentUrl && (
                                    <Button variant="secondary" asChild>
                                        <Link href={post.documentUrl} target="_blank" rel="noopener noreferrer">
                                            View Document
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {!isLoading && filteredPosts.length === 0 && (
                <div className="text-center text-muted-foreground py-12 col-span-1 lg:col-span-2">
                    <p className="font-semibold text-lg">No Posts Found</p>
                    <p className="text-sm">{searchQuery || selectedCategory !== 'All' ? `Try adjusting your filters.` : 'Be the first to create a post!'}</p>
                </div>
            )}
        </div>
    );
}
