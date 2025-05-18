
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfUseFeature() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <CardTitle className="text-3xl md:text-4xl font-bold">Terms and Conditions</CardTitle>
          <CardDescription className="text-sm text-muted-foreground pt-1">
            Last Updated: May 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            Welcome to this website operated by Mavtrevor Digital Inc. (hereinafter referred to as "MDI"). These Terms and Conditions—including our Privacy Policy—govern your use of this website (the "Website") and constitute a legally binding agreement between you (referred to as "User," "you," or "your") and MDI.
          </p>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using this Website in any manner, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these Terms, you should not use this Website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. Permitted Use of Website Content</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>You are free to share, redistribute, embed, and copy the contents of this Website.</li>
              <li>All shared content must include a link back to this Website.</li>
              <li>You may not modify or sell any content from this Website without express written permission from MDI.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Third-Party Links and References</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>MDI is not responsible for the content of third-party websites that are mentioned or advertised on this Website.</li>
              <li>MDI is also not liable for the content of any website that links to this Website or uses our content.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. Disclaimer of Warranties</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>MDI does not guarantee that the Website will be free of errors, interruptions, omissions, or defects.</li>
              <li>MDI makes no warranty that such issues will be corrected and does not promise uninterrupted or secure access to the Website.</li>
              <li>You are solely responsible for any costs associated with using this Website, including any necessary servicing or repair of equipment.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
            <p>
              Under no circumstances shall MDI, or any of its affiliates, officers, directors, employees, licensors, suppliers, or distributors be liable for any direct, indirect, incidental, special, economic, or consequential damages arising from your use of this Website.
            </p>
            <p>
              Even if MDI has been advised of the possibility of such damages, liability is limited to the amount you paid, if any, for products or services from MDI.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">6. Modifications to Terms</h2>
            <p>
              MDI reserves the right to change these Terms and Conditions at any time, without prior notice.
            </p>
            <p>
              Updated Terms will take effect immediately upon publication on this Website. Continued use of the Website after changes implies your acceptance of the new Terms.
            </p>
          </section>

          <p className="pt-4">
            If you have questions about these Terms and Conditions, please contact us via the details provided on our Website.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
