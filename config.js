/* Site settings you fill in yourself.

   LOGIN SERVICE
   Real accounts need a login service. This site is built for Supabase (free plan is enough):
     1. Create a project at supabase.com.
     2. In the project's SQL editor, run the file supabase-setup.sql from this folder.
     3. In Project Settings > API, copy the "Project URL" and the "anon public" key into the two lines below.
   The anon key is designed to be public; never paste the "service_role" key here.

   While both values are empty the site runs in PREVIEW MODE: accounts are saved only in the
   visitor's own browser, so they do not work on another device and are not real accounts. */
window.AS_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
  discordInvite: '',                  // e.g. https://discord.gg/yourcode (shown to Pro members)
  contactEmail: 'hello@yourdomain.com',
};
