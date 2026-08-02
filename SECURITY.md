# Security Notes

Filmska Teorija is a static local-first app. There is no server-side trust boundary in this build.

## Current Controls

- Media URL fields accept only `http` and `https` URLs.
- Third-party embeds use a sandboxed iframe with a restricted permission list.
- User media URLs, scene breakdowns, reader links, and essay notes are stored only in browser localStorage.
- GA4 is inactive unless `VITE_GA_MEASUREMENT_ID` is configured.
- AdSense slots are placeholders and no publisher ID is present.

## Security Contact

Open a GitHub issue on the repository for non-sensitive reports. Do not include secrets, private media URLs, or copyrighted files in public issues.
