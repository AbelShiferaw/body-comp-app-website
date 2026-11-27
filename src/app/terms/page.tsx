import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The terms for using ${site.name}.`,
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  const email = site.contactEmail;
  return (
    <LegalPage title="Terms of use" updated="November 20, 2026">
      <p>
        These terms are an agreement between you and {site.legalEntity} (&quot;{site.name}&quot;,
        &quot;we&quot;, &quot;us&quot;) for the {site.name} website and mobile app (the
        &quot;Services&quot;). By using the Services you agree to these terms and to our{" "}
        <a href="/privacy">privacy policy</a>.
      </p>

      <h2>1. Not medical advice</h2>
      <p>
        {site.name} visualizes body composition data for general fitness and informational purposes.
        It is not a medical device, and it does not diagnose, treat or prevent any condition.
        Estimates, including photo-based estimates, may be inaccurate. Talk to a qualified health
        professional before making medical, diet or training decisions.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old to use the Services. You are responsible for your account
        and for keeping your sign-in details secure. Tell us right away if you think someone else
        has access to your account.
      </p>

      <h2>3. Beta</h2>
      <p>
        Beta versions are provided for testing, may change or stop working, and may lose data.
        Please do not rely on a beta as your only record of your scans. We may ask for feedback, and
        you agree we can use it to improve the Services without any obligation to you.
      </p>

      <h2>4. Your data and content</h2>
      <p>
        You own the data and photos you add. You give us a limited license to store and process them
        only to provide the Services to you, as described in the privacy policy. Using your data to
        train our models requires your separate opt-in.
      </p>

      <h2>5. Third-party providers</h2>
      <p>
        If you connect a DEXA provider or another third-party service, your use of that service is
        governed by its own terms. We are not responsible for the accuracy or availability of data
        from third parties. Third-party names and trademarks belong to their owners, and their use
        does not imply endorsement.
      </p>

      <h2>6. Subscriptions</h2>
      <p>
        Some features may require a paid subscription, purchased through the App Store or Google
        Play. Prices will be shown before you buy. Subscriptions renew automatically until you
        cancel in your App Store or Google Play account settings, and refunds are handled under
        those stores&apos; policies.
      </p>

      <h2>7. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Upload data or photos of another person without their permission.</li>
        <li>Reverse engineer, scrape or interfere with the Services.</li>
        <li>Use the Services to break the law or infringe anyone&apos;s rights.</li>
      </ul>

      <h2>8. Our intellectual property</h2>
      <p>
        The Services, including the software, 3D models and design, belong to us or our licensors.
        We give you a personal, non-transferable license to use the app while you follow these
        terms.
      </p>

      <h2>9. Ending your use</h2>
      <p>
        You can stop using the Services and delete your account at any time. We may suspend or end
        access if you break these terms or to protect the Services or other users.
      </p>

      <h2>10. Disclaimers and limitation of liability</h2>
      <p>
        The Services are provided &quot;as is&quot; without warranties of any kind, to the extent
        the law allows. To the extent the law allows, we are not liable for indirect, incidental or
        consequential damages, and our total liability for any claim is limited to the amount you
        paid us in the 12 months before the claim, or $50 if you paid nothing.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of [STATE], United States, without regard to its
        conflict-of-law rules. [Dispute resolution terms to be confirmed in legal review.]
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these terms. We will post the new version here and, for material changes,
        notify you in the app or by email before they take effect.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions: <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalPage>
  );
}
