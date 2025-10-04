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
import { Link, PlusCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const dataSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  sourceUrl: z.string().url('Please enter a valid URL for the data source.'),
});

function ShareDataForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof dataSchema>>({
    resolver: zodResolver(dataSchema),
    defaultValues: { title: '', description: '', sourceUrl: '' },
  });

  async function onSubmit(values: z.infer<typeof dataSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to upload data.',
      });
      return;
    }
    setIsSubmitting(true);

    const userUploadData = {
      title: values.title,
      description: values.description,
      sourceUrl: values.sourceUrl,
      uploaderId: user.uid,
      uploaderName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    const dataUploadsRef = collection(firestore, 'dataUploads');
    addDoc(dataUploadsRef, userUploadData)
      .then(() => {
        toast({
          title: 'Data Source Submitted!',
          description: 'Thank you for contributing to the community dataset.',
        });
        form.reset();
        setDialogOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: dataUploadsRef.path,
          operation: 'create',
          requestResourceData: userUploadData,
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
              <FormLabel>Data Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Arctic Sea Ice Extent Data" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sourceUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Source URL</FormLabel>
              <FormControl>
                <Input placeholder="https://climate.nasa.gov/vital-signs/arctic-sea-ice/" {...field} />
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
                  placeholder="Briefly describe the dataset and what it contains..."
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
            {isSubmitting ? 'Submitting...' : 'Submit Data Source'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function DataPage() {
    const { firestore } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useUser();

    const dataUploadsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'dataUploads'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );

    const { data: dataUploads, isLoading } = useCollection<any>(dataUploadsQuery);

    const filteredData = useMemo(() => {
        if (!dataUploads) return [];
        return dataUploads.filter(upload => 
            upload.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [dataUploads, searchQuery]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-3xl">Shared Data Sources</h1>
                    <p className="text-muted-foreground">
                        Contribute to the community by sharing valuable environmental datasets.
                    </p>
                </div>
                {user &&
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Share Data
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Submit New Data</DialogTitle>
                            <DialogDescription>
                                Provide a link and a description for a public dataset.
                            </DialogDescription>
                        </DialogHeader>
                        <ShareDataForm setDialogOpen={setIsDialogOpen} />
                    </DialogContent>
                </Dialog>
                }
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Filter data sources..."
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

                {!isLoading && filteredData.map(upload => (
                    <Card key={upload.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="line-clamp-2">{upload.title}</CardTitle>
                            <CardDescription>
                                By {upload.uploaderName} • {upload.createdAt ? formatDistanceToNow(upload.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="line-clamp-4 text-sm text-muted-foreground">{upload.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline" size="sm">
                                <a href={upload.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    <Link className="mr-2 h-4 w-4" />
                                    View Source
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {!isLoading && filteredData.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No data sources found.</p>
                    <p className="text-sm">{searchQuery ? 'Try adjusting your filter.' : 'Be the first to share one!'}</p>
                </div>
            )}
        </div>
    );
}
