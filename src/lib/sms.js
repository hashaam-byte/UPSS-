// /lib/sms.js
// Thin abstraction over an SMS provider so the actual gateway can be swapped
// without touching any auth/route code. Defaults to Termii (widely used for
// Nigerian numbers) but any provider can be dropped in behind sendSms().
//
// Required env vars (choose one provider and set SMS_PROVIDER accordingly):
//   SMS_PROVIDER=termii
//   TERMII_API_KEY=...
//   TERMII_SENDER_ID=...   (must be pre-registered with Termii)
//
// NOTE: no SMS provider is configured yet in this project. Until env vars
// are set, sendSms() logs to the console instead of throwing, so local
// development doesn't hard-fail — but this means OTPs will NOT actually
// reach a phone until a real provider is wired up.

export async function sendSms(phone, message) {
  const provider = process.env.SMS_PROVIDER;

  if (!provider) {
    console.warn(`[SMS] No SMS_PROVIDER configured. Would have sent to ${phone}: ${message}`);
    return { success: true, simulated: true };
  }

  if (provider === 'termii') {
    return sendViaTermii(phone, message);
  }

  throw new Error(`Unsupported SMS_PROVIDER: ${provider}`);
}

async function sendViaTermii(phone, message) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;

  if (!apiKey || !senderId) {
    throw new Error('TERMII_API_KEY and TERMII_SENDER_ID must be set when SMS_PROVIDER=termii');
  }

  const response = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      from: senderId,
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: apiKey
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Termii SMS send failed:', data);
    throw new Error('Failed to send SMS');
  }

  return { success: true, providerResponse: data };
}
