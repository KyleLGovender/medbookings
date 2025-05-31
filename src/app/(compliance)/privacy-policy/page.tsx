import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Medbookings',
  description: 'Learn how Medbookings protects and handles your personal information',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>

      <div className="space-y-8 text-gray-700">
        <section>
          <p className="leading-relaxed">
            Medbookings is committed to protecting your privacy and handling your personal
            information in a secure and responsible manner. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your personal data in accordance with the
            Protection of Personal Information Act (POPIA) and the Promotion of Access to
            Information Act (PAIA).
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">1. Information We Collect</h2>
          <p className="leading-relaxed">
            We collect personal information that you voluntarily provide when you register on our
            platform or use our services. This may include your name, contact details, HPCSA
            registration number, health information (for healthcare purposes), and any other
            information relevant to billing.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">2. How We Use Your Information</h2>
          <p className="leading-relaxed">Your personal information is used to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Facilitate appointment bookings with healthcare providers</li>
            <li>Improve our platform and service offerings</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Communicate with you regarding services or updates</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">3. Sharing of Information</h2>
          <p className="leading-relaxed">
            At Medbookings, we take your personal information very seriously and do not sell or
            lease your personal data to any third parties. We only share your personal information
            with third parties when necessary to provide our services (e.g., with healthcare
            providers), or when legally required to do so.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">4. Data Security and Retention</h2>
          <p className="leading-relaxed">
            Medbookings implements appropriate technical and organizational security measures to
            protect your data. We retain your personal information for as long as is necessary to
            fulfill the purposes in this policy or as required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">5. Data Subject Rights</h2>
          <p className="leading-relaxed">As a Service Provider or user, you have the right to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Access the personal information we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to or restrict the processing of your information</li>
            <li>Lodge a complaint with the Information Regulator of South Africa</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            You can exercise these rights by submitting a Data Subject Access Request (DSAR) to our
            Information Officer at{' '}
            <a href="mailto:support@medbookings.co.za" className="text-blue-600 hover:underline">
              support@medbookings.co.za
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">6. Cookies and Tracking</h2>
          <p className="leading-relaxed">
            We may use cookies and similar technologies to enhance user experience and track usage
            of our platform. You can modify your browser settings to disable cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">7. Third-Party Services</h2>
          <p className="leading-relaxed">
            Our platform may link to third-party services for convenience. These services have their
            own privacy policies and we are not responsible for their content or practices.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">8. Access to Information (PAIA)</h2>
          <p className="leading-relaxed">
            In compliance with the Promotion of Access to Information Act (PAIA), our PAIA Manual
            outlines how requests for access to public and personal records should be made. The
            manual is available upon request by contacting our Information Officer.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">9. Updates to this Policy</h2>
          <p className="leading-relaxed">
            We may revise this Privacy Policy from time to time. Material changes will be
            communicated via email or notices on our platform. Your continued use of the platform
            constitutes your acceptance of any updates.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions about this Privacy Policy or our data protection practices, please
            contact our Information Officer at{' '}
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
            <a href="/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
