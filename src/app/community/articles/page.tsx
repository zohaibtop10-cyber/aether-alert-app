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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  content: z.string().min(50, 'Article content must be at least 50 characters.'),
});

function CreateArticleForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: '', content: '' },
  });

  async function onSubmit(values: z.infer<typeof articleSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit an article.',
      });
      return;
    }
    setIsSubmitting(true);

    const articleData = {
      title: values.title,
      content: values.content,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    const articlesRef = collection(firestore, 'articles');
    addDoc(articlesRef, articleData)
      .then(() => {
        toast({
          title: 'Article Submitted!',
          description: 'Thank you for your contribution.',
        });
        form.reset();
        setDialogOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: articlesRef.path,
          operation: 'create',
          requestResourceData: articleData,
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
              <FormLabel>Article Title</FormLabel>
              <FormControl>
                <Input placeholder="The Impact of Melting Glaciers" {...field} />
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
              <FormLabel>Article Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Start your detailed article here..."
                  className="min-h-[250px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Article'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function ArticlesPage() {
  const { firestore } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();

  const articlesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'articles'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  
  const { data: articles, isLoading } = useCollection<any>(articlesQuery);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="font-semibold text-3xl">Community Articles</h1>
            <p className="text-muted-foreground">
            Share your research and in-depth analysis with the community.
            </p>
        </div>
        {user &&
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Write an Article
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a New Article</DialogTitle>
              <DialogDescription>
                Your article will be reviewed and published for the community to read.
              </DialogDescription>
            </DialogHeader>
            <CreateArticleForm setDialogOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
        }
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Filter articles..."
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

        {!isLoading && filteredArticles.map(article => (
          <Card key={article.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{article.title}</CardTitle>
              <CardDescription>
                By {article.authorName} • {article.createdAt ? formatDistanceToNow(article.createdAt.toDate(), { addSuffix: true }) : 'just now'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-4 text-sm text-muted-foreground">{article.content}</p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" size="sm">Read More</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

       {!isLoading && filteredArticles.length === 0 && (
         <div className="text-center text-muted-foreground py-12">
            <p>No articles found.</p>
            <p className="text-sm">{searchQuery ? `Try adjusting your filter.` : 'Be the first to write one!'}</p>
         </div>
       )}
    </div>
  );
}
