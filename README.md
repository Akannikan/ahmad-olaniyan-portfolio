# Ahmad Olaniyan — Portfolio

A responsive React, TypeScript, and Vite portfolio with a private Supabase-backed dashboard at `/admin`. Update the profile, portrait, CV, projects, certificate images, gallery, skills, experience, and social links from the dashboard; saved content is shared with every visitor. Public and private documents are managed at `/files`.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Create a production build: `npm run build`
5. Preview the production build locally: `npm run preview`

## Admin dashboard and uploads

The dashboard requires Supabase Auth, database tables, and Supabase Storage. Portfolio images use a public bucket. The `/files` library uses separate public and private buckets; visitors can access only documents the administrator explicitly marks public. Only the configured admin user can upload, replace, or delete files and saved content.

1. Create a Supabase project.
2. In **Authentication → Users**, create your private admin user. Do not enable public sign-ups.
3. Copy that user's UUID from Supabase Auth.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` to the project URL from **Project Settings → API** (for example, `https://your-project.supabase.co`, without `/rest/v1`), `VITE_SUPABASE_ANON_KEY`, and `VITE_ADMIN_USER_ID` to the UUID copied in step 3.
5. Open `supabase/schema.sql`. Replace every occurrence of `REPLACE_WITH_ADMIN_USER_UUID` with that same admin UUID, then run the full script in the Supabase SQL Editor. This creates the portfolio and documents tables, storage buckets, and row-level access policies required for saving and uploading. If you already ran an earlier version of this setup, run the updated script again to add document storage and access policies.
6. Restart `npm run dev`, open `/admin`, and sign in with the admin user.
7. Upload up to three profile photos, an original CV PDF, project images, certificates, and gallery images; add your social profile URLs and edit your content. The home-page profile photos transition with a subtle zoom and fade every five seconds, and clicking a photo flips it. The first photo is used in the generated CV and shown on the About page. Save changes to publish them to the website.
8. Open `/files` while signed in as the configured administrator to add, replace, preview, or delete documents. Select the public-download option only for files intended for anyone to access. Supported formats are PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/JPEG, PNG, SVG, and MP4, up to 25 MB per file. Private documents are listed only to the administrator and use short-lived signed URLs for access.

The dashboard restricts sign-in to the configured admin UUID, and Supabase row-level security and storage policies enforce the same restriction on database writes and file uploads/deletes. Storage bucket limits and document table constraints enforce file size, format, title, and description bounds independently of the browser UI. Never add a Supabase service-role key to this frontend or to a `VITE_` variable. The public anon key is expected to be used in the browser; the RLS policies are the security boundary.

The CV button on the public homepage generates a profile PDF from your saved details and embeds your uploaded portrait as the passport/profile photo. If you also upload an original CV PDF, the site provides it as a separate download.

## Contact form setup

The form uses EmailJS and does not send messages until configured.

1. Create an EmailJS service and template.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` to the values from your EmailJS account.
4. Configure the template to accept `from_name`, `reply_to`, `subject`, and `message`.
5. Restart the Vite server after changing environment variables.

Never put an EmailJS private key or other secret in a `VITE_` variable. The public key is intended for browser use. The form shows an explicit error when it is unconfigured or a submission fails.

## Personalise the content

Use the `/admin` dashboard rather than changing source files. Replace starter information with confirmed details before publishing. Software Engineer remains the primary role; add other roles as supporting work. The dashboard accepts LinkedIn, GitHub, WhatsApp, Facebook, and TikTok URLs, and the email address is displayed publicly on the contact page. Add a certificate image to a Certification or Achievement timeline item, or upload and caption general images in the Gallery tab. Gallery images appear on the home page and at `/gallery`.

## Deployment

The app is configured for Vercel, including the React Router fallback in `vercel.json`.

1. Import the GitHub repository into Vercel and keep the detected Vite settings (`npm run build` and `dist`).
2. In the Vercel project settings, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_ADMIN_USER_ID` for Production and Preview. Copy their values from your local `.env.local`; never upload that file or add a Supabase service-role key.
3. If the contact form is configured, also add `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY`.
4. Deploy. Vercel assigns a `vercel.app` address and automatically builds future pushes to the connected GitHub branch. Redeploy after changing environment variables.

Connect a custom domain in project settings only after you register/own a valid domain.
