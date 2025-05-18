
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyFeature() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <CardTitle className="text-3xl md:text-4xl font-bold">Privacy Policy</CardTitle>
          <CardDescription className="text-sm text-muted-foreground pt-1">
            Last Updated: May 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            This website is owned and managed by Mavtrevor Digital Inc. ("MDI"). Your privacy is important to us, and we are committed to protecting your personal data and maintaining your trust as you use our services. This Privacy Policy outlines the information we collect, how we use it, and the choices you have concerning your data.
          </p>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>MDI collects two main types of information from users:</p>
            <h3 className="text-lg font-medium mt-2">Voluntarily Provided Information</h3>
            <p>This includes data you submit when subscribing to newsletters, using interactive features like forums or polls, or contacting us directly. Such information may include your name, email address, or feedback.</p>
            <h3 className="text-lg font-medium mt-2">Automatically Collected Data</h3>
            <p>We gather non-personally identifiable information through analytics and traffic tracking tools to understand how users interact with our content. This helps us improve the user experience and customize our offerings.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. Ways We Collect Information</h2>
            <h3 className="text-lg font-medium mt-2">Newsletters</h3>
            <p>When you subscribe to our newsletter, we collect your email address. You can unsubscribe at any time via the link in any email we send.</p>
            <h3 className="text-lg font-medium mt-2">Forums and Interactive Areas</h3>
            <p>To participate in our forums, you may be asked to register an account. Information such as your username and email address may be required.</p>
            <h3 className="text-lg font-medium mt-2">“Share with a Friend” Feature</h3>
            <p>If you use this feature, we may collect your email and the recipient’s to ensure the message is properly sent. We do not store or use this information for any other purpose.</p>
            <h3 className="text-lg font-medium mt-2">Polls and Surveys</h3>
            <p>Poll responses are anonymous and used in aggregate for content planning. Surveys may collect demographic information to help us understand our audience better, but we do not share personally identifiable data with third parties.</p>
            <h3 className="text-lg font-medium mt-2">Children’s Privacy</h3>
            <p>MDI does not knowingly collect personal information from children under the age of 13. In accordance with COPPA (Children’s Online Privacy Protection Act), parental consent is required if this occurs.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tools to enhance your browsing experience and collect anonymous usage data. Cookies help us:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Analyze site traffic and usage</li>
              <li>Understand user preferences</li>
              <li>Improve site functionality</li>
            </ul>
            <p>You can disable cookies in your browser settings. Please note that some features of the site may not function properly without cookies.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. How We Use Your Information</h2>
            <p>MDI uses collected data to:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Personalize your experience on our site</li>
              <li>Deliver newsletters and updates you’ve subscribed to</li>
              <li>Improve site content and performance</li>
              <li>Conduct research, polls, and surveys</li>
              <li>Comply with legal obligations or respond to lawful requests</li>
            </ul>
            <p>We do not sell, rent, or trade your personal data to third parties.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">5. Data Sharing and Disclosure</h2>
            <p>We may disclose your information only when:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Required by law or legal process</li>
              <li>Necessary to protect the rights, safety, or property of our users or the public</li>
              <li>Assisting third-party service providers who operate under confidentiality agreements and help us deliver services (e.g., email systems or analytics tools)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">6. Data Security</h2>
            <p>We take reasonable precautions to protect your information using industry-standard security measures, including:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Firewall and encryption protections</li>
              <li>Restricted access to personal data</li>
              <li>Regular reviews of our privacy and security practices</li>
            </ul>
            <p>While we do our best, no method of internet transmission is 100% secure.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">7. Your Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Opt out of receiving our newsletters at any time</li>
              <li>Refuse cookies (via your browser settings)</li>
              <li>Avoid participating in any feature that requires personal data</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
            <p>
              MDI reserves the right to update this Privacy Policy at any time. If we make significant changes, we will notify users via this page or email (if applicable). Continued use of the site after any changes implies your acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">9. Your Consent</h2>
            <p>
              By using this website, you agree to the collection and use of information as outlined in this policy. For any questions or concerns about your privacy or data, please contact us directly.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
