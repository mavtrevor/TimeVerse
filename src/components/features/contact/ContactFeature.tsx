
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { sendContactMessage, type ContactFormInput } from '@/ai/flows/contact-flow'; // Import the flow

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, { message: "Name must not exceed 100 characters."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }).max(150, { message: "Subject must not exceed 150 characters."}),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(2000, { message: "Message must not exceed 2000 characters."}),
});

export default function ContactFeature() {
  const { toast } = useToast();
  const form = useForm<ContactFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(values: ContactFormInput) {
    console.log('[ContactForm] onSubmit triggered with values:', values);
    setIsSubmitting(true);
    try {
      console.log('[ContactForm] Calling sendContactMessage flow...');
      const result = await sendContactMessage(values);
      console.log('[ContactForm] Flow call completed. Result:', result);

      if (result.status === 'Success') {
        toast({
          title: "Message Sent!",
          description: result.message,
        });
        form.reset();
        console.log('[ContactForm] Form reset successfully.');
      } else {
        toast({
          title: "Submission Error",
          description: result.message || "Could not send the message. Please try again.",
          variant: "destructive",
        });
        console.warn('[ContactForm] Submission error from flow:', result);
      }
    } catch (error) {
      console.error('[ContactForm] Catch block: Error during contact form submission:', error);
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      console.log('[ContactForm] Finally block: isSubmitting set to false.');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold">Contact Us</CardTitle>
          <CardDescription className="text-md md:text-lg text-muted-foreground">
            Have a question or feedback? Fill out the form below to get in touch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="What is your message about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Message
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center block pt-6">
            <p className="text-xs text-muted-foreground">
                We aim to respond within 24-48 business hours.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
