import type { NextConfig } from "next";

// Security headers applied to every response. These are conservative
// enough not to break the app (verified only via `next build`'s type
// checking in this environment — actual browser behavior of the CSP in
// particular should be tested against a real deployment before relying
// on it, then tightened further, e.g. Cloudinary/domain lists narrowed).
const securityHeaders = [
  // Stops the site being framed by another origin (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Stops browsers guessing content types away from what the server declared.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limits how much referrer info leaks to other sites when a user clicks out.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables browser features this app doesn't use, reducing attack surface.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Forces HTTPS for a year once a browser has seen it once. Only meaningful
  // once actually deployed on HTTPS (which Vercel does by default).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // React's development overlay uses eval() for component stack traces;
      // production builds must keep eval blocked.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      // Cloudinary for uploaded files/images; data: for inline SVG icons.
      "img-src 'self' data: res.cloudinary.com",
      // API calls this app makes from the browser: itself, and Paystack's
      // checkout page is a full-page redirect (not embedded), so no
      // frame-src/connect-src entry is needed for it here.
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
