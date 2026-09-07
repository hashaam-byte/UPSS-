import React from 'react';

export const metadata = {
  title: 'Privacy Policy — U-Plus',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: [insert date before publishing]</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p>
              U-Plus ("we", "us", "the platform") provides school management software to
              registered schools ("Schools") and their staff, students, and parents
              (together, "Users"). This policy explains what personal data we collect,
              why, and how it's protected, in line with the Nigeria Data Protection
              Regulation (NDPR) and the Nigeria Data Protection Act 2023.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who controls this data</h2>
            <p>
              Each School is the primary data controller for the information of its own
              staff, students, and parents — the School decides what student and staff
              information to enter into U-Plus. U-Plus acts as a data processor, storing
              and processing that information on the School's behalf, and providing the
              School's own account holders with a way to view, use, and manage it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information: name, email, phone number, username, and a securely hashed password (we never store passwords in plain text).</li>
              <li>Academic records: grades, attendance, assignments, test results, timetables, and subject enrollment.</li>
              <li>School administration data: class assignments, staff roles, fee/payment records.</li>
              <li>Parent/guardian information: name, phone number, and relationship to a student, used to link a parent account to their child and to send SMS verification codes.</li>
              <li>Files uploaded by teachers and students (assignments, learning resources), stored via our file-storage provider.</li>
              <li>Basic technical data such as login timestamps and IP address, used for account security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data belonging to minors</h2>
            <p>
              Most students using U-Plus are minors. Student accounts and data are created
              and managed by the School, which is responsible for obtaining any consent
              required under its own enrollment agreements with parents/guardians before
              entering a student's information into U-Plus. Parents can create their own
              linked account to view their child's academic information, verified by SMS
              to the phone number the School has on file for that parent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How we use this data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide the core service: dashboards, grading, attendance, timetables, messaging, and the parent portal.</li>
              <li>To send account-related communications: password resets, SMS verification codes, and important notices.</li>
              <li>To generate AI-assisted test questions from teacher-provided topics, using a third-party AI provider (see below) — no student personal data is sent to the AI provider as part of this feature.</li>
              <li>To maintain the security and integrity of the platform, including detecting misuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Third parties we use</h2>
            <p>We share limited data with the following service providers, only as needed to operate the platform:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Cloudinary</strong> — stores uploaded files (assignments, resources).</li>
              <li><strong>Neon</strong> — hosts our database.</li>
              <li><strong>Termii</strong> — sends SMS verification codes to parent phone numbers.</li>
              <li><strong>Email provider (SMTP)</strong> — sends account emails such as password resets.</li>
              <li><strong>Google (Gemini API)</strong> — used only for AI-generated test question drafts; no student personal data is sent.</li>
            </ul>
            <p className="mt-2">
              We do not sell personal data to anyone, and we do not use student or parent
              data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data retention</h2>
            <p>
              We retain account and academic data for as long as a School's account
              remains active, and for a reasonable period afterward in case the School
              renews or needs to export records. A School admin can request deletion of
              their School's data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your rights</h2>
            <p>Subject to applicable law, you may request to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate information.</li>
              <li>Request deletion of your account, where this doesn't conflict with the School's own record-keeping needs.</li>
            </ul>
            <p className="mt-2">
              Requests relating to a student's data should generally go through the
              student's School first, since the School controls that data. Requests can
              also be sent to the contact below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
            <p>
              Passwords are stored using industry-standard hashing (bcrypt), not in plain
              text. Access to student and staff data is restricted by role — a teacher,
              for example, cannot see another class's private records. We use encrypted
              connections (HTTPS) for all data in transit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy as the platform grows. Material changes will be
              communicated to School admins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Questions about this policy or a data request can be sent to:
              [insert contact email/WhatsApp number before publishing].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
