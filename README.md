# Ahmad Olaniyan — Portfolio

A responsive React, TypeScript, and Vite portfolio with a private Supabase-backed dashboard at `/admin`. Update the profile, portrait, CV, project gallery, skills, and experience from the dashboard; saved content is shared with every visitor.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Create a production build: `npm run build`
5. Preview the production build locally: `npm run preview`

## Admin dashboard and uploads

The dashboard requires Supabase Auth, a database table, and public portfolio asset storage. The bucket is public so the portfolio can display images and visitors can download the CV. Only the configured admin user can upload or change files and saved content.

1. Create a Supabase project.
2. In **Authentication → Users**, create your private admin user. Do not enable public sign-ups.
3. Copy that user's UUID from Supabase Auth.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` to the project URL from **Project Settings → API** (for example, `https://your-project.supabase.co`, without `/rest/v1`), `VITE_SUPABASE_ANON_KEY`, and `VITE_ADMIN_USER_ID` to the UUID copied in step 3.
5. Open `supabase/schema.sql`. Replace every occurrence of `REPLACE_WITH_ADMIN_USER_UUID` with that same admin UUID, then run the full script in the Supabase SQL Editor. This creates the portfolio table, public asset bucket, and access policies required for saving and uploading.
6. Restart `npm run dev`, open `/admin`, and sign in with the admin user.
7. Upload your portrait, original CV PDF, project images, and edit your content. Save changes to publish them to the website.

The dashboard restricts sign-in to the configured admin UUID, and Supabase row-level security enforces the same restriction on database writes and file uploads. Never add a Supabase service-role key to this frontend or to a `VITE_` variable. The public anon key is expected to be used in the browser; the RLS policies are the security boundary.

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

Use the `/admin` dashboard rather than changing source files. Replace starter information with confirmed details before publishing. The LinkedIn and GitHub fields accept profile URLs; the email field is displayed publicly on the contact page.

## Deployment

To publish this workspace without connecting a Git repository, create a Vercel account, run `npx vercel login`, and then `npx vercel` from the project directory. Add the three Supabase environment variables and (if used) the three EmailJS values in Vercel's project settings, then run `npx vercel --prod`. `vercel.json` configures React Router fallback. Add the same variables to Vercel as in `.env.local`, but never add a service-role key. Vercel will assign a `vercel.app` address; connect a custom domain in project settings only after you register/own a valid domain.
