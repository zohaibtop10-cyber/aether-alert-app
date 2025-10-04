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
import { useFirebase, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const dataSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  sourceUrl: z.string().url('Please enter a valid URL for the data source.'),
});

export default function DataPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof dataSchema>>({
    resolver: zodResolver(dataSchema),
    defaultValues: {
      title: '',
      description: '',
      sourceUrl: '',
    },
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-semibold text-3xl">Share a Data Source</h1>
        <p className="text-muted-foreground">
          Contribute to the community by sharing valuable environmental datasets.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Submit New Data</CardTitle>
              <CardDescription>
                Provide a link and a description for a public dataset or data source.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Data Source'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
