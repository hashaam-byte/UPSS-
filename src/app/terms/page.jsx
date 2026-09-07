import React from 'react';

export const metadata = {
  title: 'Terms of Service — U-Plus',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: [insert date before publishing]</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p>
              These Terms govern use of U-Plus by any School that registers an account,
              and by any staff member, student, or parent who uses an account created
              under that School. By creating or using an account, you agree to these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. The service</h2>
            <p>
              U-Plus is a school management platform: attendance, grading, timetables,
              assignments, messaging, and a parent portal. We may add, change, or remove
              features over time as the platform develops.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Accounts and responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>A School's admin account is responsible for the accuracy of student, staff, and academic data entered into the platform.</li>
              <li>Each account holder is responsible for keeping their password confidential and for all activity under their account.</li>
              <li>Schools are responsible for obtaining any consents needed from parents/guardians (under their own enrollment terms) before entering a student's data.</li>
              <li>Accounts may not be shared, sold, or transferred between individuals.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Subscription and payment</h2>
            <p>
              School accounts operate on a subscription basis, billed per the pricing
              shown on the platform at the time of signup or renewal, which may be
              updated from time to time. Payment is currently made by bank transfer to
              the details provided, confirmed manually by our team. Refunds, where
              applicable, are governed by our separate Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Suspension and termination</h2>
            <p>
              If a School's subscription payment is not received by the applicable
              deadline, we will send advance reminders before any action is taken —
              typically one week before the deadline, and a final notice a few days
              before. If payment is still not received by the deadline, the School's
              account, including its unique login page, and all staff, student, and
              parent accounts under it, may be suspended until payment is made. We may
              also suspend or terminate an account for violation of these Terms,
              including misuse of the platform, or accessing another School's data
              without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Attempt to access data belonging to another School or another user without authorization.</li>
              <li>Upload content that is unlawful, harassing, or infringes someone else's rights.</li>
              <li>Attempt to disrupt, reverse-engineer, or interfere with the platform's operation.</li>
              <li>Use the platform to send spam or unsolicited bulk messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual property</h2>
            <p>
              U-Plus and its software, design, and branding belong to us. Schools and
              their users retain ownership of the data and content they upload (student
              records, assignments, resources); by using the platform, you grant us the
              limited right to store and process that content solely to provide the
              service to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Disclaimer and limitation of liability</h2>
            <p>
              The platform is provided "as is." While we work to keep it reliable and
              secure, we do not guarantee uninterrupted or error-free operation. To the
              maximum extent permitted by law, U-Plus is not liable for indirect,
              incidental, or consequential damages arising from use of the platform,
              including loss of data, loss of access during a payment-related
              suspension, or decisions made based on information in the platform. Our
              total liability for any claim is limited to the subscription fees paid by
              the affected School in the three months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to these Terms</h2>
            <p>
              We may update these Terms as the platform develops. Continued use of the
              platform after a change means you accept the updated Terms. Material
              changes will be communicated to School admins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Governing law</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Questions about these Terms can be sent to:
              [insert contact email/WhatsApp number before publishing].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
