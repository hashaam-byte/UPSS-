import React from 'react';

export const metadata = {
  title: 'Refund Policy — U-Plus',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: [insert date before publishing]</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p>
              This policy explains how refunds work for U-Plus School subscriptions.
              Payments are currently made directly by bank transfer and confirmed
              manually by our team — there is no automated payment gateway involved yet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Before you pay</h2>
            <p>
              We encourage every School to use the trial period, if available, to
              confirm the platform meets their needs before committing to a paid
              subscription. Pricing is shown on the platform before payment is made.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Refund eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Duplicate or mistaken payment</strong> (e.g. paid twice for the
                same period): fully refundable — contact us with your payment
                reference.
              </li>
              <li>
                <strong>Service not provided</strong> (e.g. payment confirmed but access
                not activated within a reasonable time due to our error): fully
                refundable, or we will activate access immediately as an alternative.
              </li>
              <li>
                <strong>Change of mind after activation</strong>: subscription fees are
                generally non-refundable once a School's access has been activated for
                the paid period, since the service has been made available for use.
              </li>
              <li>
                <strong>Suspension for non-payment</strong>: if a School's account is
                suspended because a subsequent payment deadline was missed, this does
                not entitle the School to a refund of amounts already paid for prior
                periods that were fully provided.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How to request a refund</h2>
            <p>
              Contact us with your School's name, the payment date, amount, and reason
              for the request, using the contact details on your subscription page or
              below. We aim to respond to refund requests within 5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How refunds are issued</h2>
            <p>
              Approved refunds are sent back to the bank account the original payment
              was made from, within a reasonable time after approval. Processing time
              may vary depending on your bank.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Changes to this policy</h2>
            <p>
              This policy may be updated as our payment process develops — for example,
              if we later introduce a live payment gateway with its own dispute process.
              Material changes will be communicated to School admins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact</h2>
            <p>
              Refund requests and questions can be sent to:
              [insert contact email/WhatsApp number before publishing].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
