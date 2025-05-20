
'use server';
/**
 * @fileOverview A Genkit flow to handle contact form submissions.
 *
 * - sendContactMessage - A function that processes the contact form data.
 * - ContactFormInput - The input type for the sendContactMessage function.
 * - ContactFormOutput - The return type for the sendContactMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ContactFormInputSchema = z.object({
  name: z.string().min(2).max(100).describe("Sender's full name."),
  email: z.string().email().describe("Sender's email address."),
  subject: z.string().min(5).max(150).describe("Subject of the message."),
  message: z.string().min(10).max(2000).describe("The content of the message."),
});
export type ContactFormInput = z.infer<typeof ContactFormInputSchema>;

const ContactFormOutputSchema = z.object({
  status: z.string().describe("Status of the message sending attempt."),
  message: z.string().describe("A confirmation or error message."),
});
export type ContactFormOutput = z.infer<typeof ContactFormOutputSchema>;

export async function sendContactMessage(input: ContactFormInput): Promise<ContactFormOutput> {
  return sendContactMessageFlow(input);
}

const sendContactMessageFlow = ai.defineFlow(
  {
    name: 'sendContactMessageFlow',
    inputSchema: ContactFormInputSchema,
    outputSchema: ContactFormOutputSchema,
  },
  async (input) => {
    console.log('New contact form submission received:');
    console.log('Name:', input.name);
    console.log('Email:', input.email);
    console.log('Subject:', input.subject);
    console.log('Message:', input.message);

    // In a real application, you would integrate with an email service here.
    // For example: await sendEmailService.send({ to: 'admin@example.com', subject: input.subject, body: ... });

    // For now, we just simulate success.
    return {
      status: 'Success',
      message: 'Your message has been received. We will get back to you shortly.',
    };
  }
);
