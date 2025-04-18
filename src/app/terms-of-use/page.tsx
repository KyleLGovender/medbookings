import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use | Medbookings',
  description: 'Terms and conditions for using the Medbookings platform',
};

export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Terms of Use</h1>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing or using the Medbookings platform, you agree to be bound by these Terms of
            Use and our Privacy Policy. If you do not agree, do not use the platform. These Terms
            apply to all users including healthcare professionals and patients.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">2. Services Provided</h2>
          <p className="leading-relaxed">
            Medbookings offers a digital appointment booking platform to service providers and users
            scheduling medical consultations to receive healthcare advice. Medbookings does not
            replace in-person medical care and does not constitute a doctor-patient relationship by
            mere platform usage.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">3. User Responsibilities</h2>
          <p className="leading-relaxed">
            Services Providers and Users are responsible for maintaining the confidentiality of
            their login credentials. All information provided during registration or use of services
            must be accurate and up-to-date. Users must not use the platform for unlawful purposes
            or to violate the rights of others.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">4. Data Protection and Privacy</h2>
          <div className="space-y-4">
            <p className="leading-relaxed">
              Medbookings adheres to the Protection of Personal Information Act (POPIA) to safeguard
              user data. All personal information is processed, stored, and secured as per our
              internal Policies and Procedures. Users have the right to access, rectify, or request
              deletion of their data, and may do so by submitting a Data Subject Access Request
              (DSAR).
            </p>
            <p className="leading-relaxed">
              In terms of our commitment to promoting transparency, accountability and effective
              governance, and in compliance with the Promotion of Access Information Act (PAIA) No.
              2 of 2000, Medbookings respects your privacy and your personal information and as
              such; we take care to protect your personal information and to keep it confidential,
              as referred to in the Medbookings PAIA Manual (available upon request by contacting
              the Information Officer).
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">5. Content and Usage Restrictions</h2>
          <p className="leading-relaxed">
            Users may not copy, distribute, or misuse any platform content or use automated systems
            to extract data. Any form of spamming, harassment, or unauthorized access to services is
            strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">6. Third-Party Services</h2>
          <p className="leading-relaxed">
            Medbookings may link to third-party services for additional functionality. We are not
            responsible for the content or practices of these external services.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">7. Data Breach Protocol</h2>
          <p className="leading-relaxed">
            In the event of a data breach, Medbookings follows a structured breach response plan
            including containment, investigation, and mandatory notification to affected users and
            the Information Regulator as required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">8. Limitation of Liability</h2>
          <p className="leading-relaxed">
            Medbookings is not liable for any direct or indirect damages arising from the use of or
            inability to access the platform, including medical decisions made by healthcare
            professionals using the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">9. Changes to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right to update these Terms at any time. Continued use of the platform
            constitutes acceptance of the amended Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">10. Governing Law</h2>
          <p className="leading-relaxed">
            These Terms are governed by the laws of the Republic of South Africa. Any disputes shall
            be resolved under South African jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">11. Contact Information</h2>
          <p className="leading-relaxed">
            For questions or concerns regarding these Terms, please contact the Medbookings
            Information Officer via{' '}
            <a href="mailto:support@medbookings.co.za" className="text-blue-600 hover:underline">
              support@medbookings.co.za
            </a>
            .
          </p>
        </section>

        <div className="mt-12 space-y-4 text-sm text-gray-500">
          <p>Effective Date: April 2025</p>
          <p>
            Please also review our{' '}
            <a href="/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
