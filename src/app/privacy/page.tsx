import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} collects, uses and protects your data.`,
  // Drafts stay out of search results until legal review signs off.
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  const email = site.contactEmail;
  return (
    <LegalPage title="Privacy policy" updated="November 20, 2026">
      <p>
        This policy explains what {site.legalEntity} (&quot;{site.name}&quot;, &quot;we&quot;,
        &quot;us&quot;) collects when you use this website and the {site.name} mobile app (together,
        the &quot;Services&quot;), how we use it, and the choices you have. Body scans and photos
        are sensitive, so we keep what we collect to what the Services need.
      </p>

      <h2>1. What we collect</h2>
      <h3>On this website</h3>
      <ul>
        <li>
          <strong>Waitlist details</strong> you give us: your email address, your phone platform
          (iPhone or Android) and whether you have had a DEXA scan.
        </li>
        <li>
          <strong>Technical data</strong> our hosting provider records when you load a page, such as
          IP address, browser type and the pages requested. We do not use advertising cookies or
          cross-site trackers on this website.
        </li>
      </ul>
      <h3>In the app</h3>
      <ul>
        <li>
          <strong>Account data</strong>: email address and, if you use Sign in with Apple or Google,
          the identifier those services share with us.
        </li>
        <li>
          <strong>Profile data</strong>: sex (used to choose a body shape), birth year, height and
          preferred units.
        </li>
        <li>
          <strong>Body composition data</strong>: results from DEXA scans you sync or enter,
          including total and regional fat mass, lean mass, body fat percentage, visceral fat and
          bone density, and the date and provider of each scan.
        </li>
        <li>
          <strong>Body photos or video</strong>, only if you choose to use photo-based estimates or
          photo check-ins.
        </li>
        <li>
          <strong>Provider connection status</strong>. When you connect a DEXA provider such as
          BodySpec, the sign-in token for that provider is stored only on your phone (in the iOS
          Keychain or Android Keystore). We store that a connection exists and when it last synced,
          not your provider password or token.
        </li>
        <li>
          <strong>Purchase status</strong> from the App Store or Google Play (through our payments
          provider) so we know which features you have unlocked. We never receive your card details.
        </li>
        <li>
          <strong>Diagnostics</strong>: crash reports and performance data, which do not include
          your body composition numbers or photos.
        </li>
      </ul>

      <h2>2. Consumer health data and your consent</h2>
      <p>
        Your body composition data and body photos are health data. We collect and process them only
        after you give separate, explicit consent in the app, and only to provide the features you
        use: building and updating your 3D body, showing trends, comparisons and estimates. You can
        withdraw consent at any time in the app; we will then stop processing that data and delete
        it as described below. Residents of Washington, Nevada and other states with consumer health
        data laws have the rights described in section 8.
      </p>
      <p>
        We do not collect biometric identifiers such as face geometry, and we do not use your photos
        to identify you.
      </p>

      <h2>3. How we use your data</h2>
      <ul>
        <li>
          To provide the Services: create your account, sync your scans and render your 3D body.
        </li>
        <li>To send you emails you asked for, such as beta invitations and launch news.</li>
        <li>
          To keep the Services secure, fix bugs and understand how features are used in aggregate.
        </li>
        <li>To comply with the law and enforce our terms.</li>
      </ul>
      <p>
        <strong>
          We do not sell your personal data, and we do not use your health data for advertising.
        </strong>
      </p>

      <h2>4. Improving our models (opt-in only)</h2>
      <p>
        We may ask whether you want to help improve our body composition estimates by letting us use
        your paired photos and scan results to train our models. This is off by default, is separate
        from your other consents, and you can turn it off at any time. Data used for training is
        de-identified first: we remove names, emails, account ids and photo metadata, and crop or
        blur faces. If you turn it off, we stop using your data for future training.
      </p>

      <h2>5. Who we share data with</h2>
      <p>
        We share data only with service providers that process it on our behalf under contract, and
        only as needed to run the Services:
      </p>
      <ul>
        <li>Cloud database, storage and authentication hosting (Supabase).</li>
        <li>Website hosting (Vercel).</li>
        <li>Sign-in providers you choose (Apple, Google).</li>
        <li>Subscription management (RevenueCat), the App Store and Google Play.</li>
        <li>Crash reporting and email delivery providers.</li>
      </ul>
      <p>
        DEXA providers you connect send your scan results to the app at your request; we do not send
        your data back to them. We may disclose data if required by law, or as part of a merger or
        acquisition, in which case this policy continues to apply to your data.
      </p>

      <h2>6. How long we keep data</h2>
      <p>
        We keep account, profile and health data while your account is open. When you delete your
        account in the app, we delete your personal data within 30 days, except where the law
        requires us to keep it. Waitlist entries are kept until launch or until you ask us to remove
        them. De-identified training data that has already been used cannot be removed from a
        trained model.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit and at rest, and database access is restricted so each user can
        only read their own records. No system is perfectly secure, and we will notify you as the
        law requires if a breach affects your data.
      </p>

      <h2>8. Your rights</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you and get a copy of it.</li>
        <li>Correct inaccurate data.</li>
        <li>Delete your data, including your health data.</li>
        <li>Withdraw consent for health data processing or model training.</li>
        <li>Know which third parties we share your data with.</li>
        <li>Appeal a decision we make about your request.</li>
      </ul>
      <p>
        You can delete your account and data in the app, or email{" "}
        <a href={`mailto:${email}`}>{email}</a>. We will not discriminate against you for using
        these rights.
      </p>

      <h2>9. Children</h2>
      <p>
        The Services are not intended for anyone under 18, and we do not knowingly collect data from
        children. If you believe a child has given us data, contact us and we will delete it.
      </p>

      <h2>10. Where data is processed</h2>
      <p>
        We are based in the United States and process data in the United States. If you use the
        Services from elsewhere, your data will be transferred to the United States.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We will post updates here and change the date above. If we make material changes, such as
        new uses of health data, we will ask for your consent again in the app.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalPage>
  );
}
