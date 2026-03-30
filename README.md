# RSS to Email

> Emails are only generated when feeds contain new items since the previous successful run.  
> If every configured feed fails to load, the workflow fails and no email is sent.

Stay on top of your favorite RSS feeds - on your own terms. This project allows you to set up custom email updates based on the RSS feeds you specify, all within the comfort of your own Github account.

Say goodbye to constantly checking for updates, and hello to staying informed on your own schedule.

[Introductory post on my blog](https://appjeniksaan.nl/linked/rss-to-email-on-github-actions)

## How does it work

- Github workflow runs on a schedule
- Workflow retrieves updates from your RSS feeds since its last successful run
- Workflow skips sending when there are no new items
- Workflow fails instead of sending when all configured feeds fail to load
- Each email contains a readable list of post titles with links and publish dates
- Workflow sends the updates through a SMTP server of your choice

## Getting started

1. [Fork](../../fork) this repository
2. Update [`feeds.txt`](feeds.txt) in the repository root with your RSS feed(s), one URL per line
3. The default configuration tracks `https://lisyarus.github.io/blog/feed.xml`
4. Update the [cron schedule](.github/workflows/send-email.yaml#L5) in the workflow file
5. Add the following [repository variables](../../settings/variables/actions) in settings:
   - `SMTP_SERVER` for example: smtp.gmail.com
   - `SMTP_PORT` for example: 587
6. Add the following [repository secrets](../../settings/secrets/actions) in settings:
   - `MAIL_TO` the mail address to send the email to
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`
7. Done :muscle:

| :warning: | The above variables and secrets can also be changed directly in the [workflow](.github/workflows/send-email.yaml), but be aware that if your repo is public that this could expose your credentials. |
| :-------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## Pro and cons

:fire: your data stays in your own Github account

:snowflake: fully customizable email

:date: receive the updates when and where you want

:poop: might have to do some tweaking

## Cron schedule

Use [crontab guru](https://crontab.guru/) to play around with the cron schedule that works best for you.

Some example schedules:

| cron             | description                                     |
| ---------------- | ----------------------------------------------- |
| 0 6 \* \* \*     | every day at 06:00                              |
| 0 9-18 \* \* 1-5 | monday to friday every hour from 09:00 to 18:00 |
| 0 10 \* \* 6     | saturday at 10:00                               |
| 0/15 \* \* \* \* | every 15 minutes                                |

Because the workflow looks at the previous successful run to determine which posts to send you, you can also disable the workflow by hand and pickup again later. There might be a limit to the amount of posts in a single RSS feed.

The feed list is read from the root [`feeds.txt`](feeds.txt) file, so it can be edited directly from the Github web UI without touching the TypeScript source. Blank lines and lines starting with `#` are ignored.

Note: Github workflow runs do [not support timezones](https://github.com/orgs/community/discussions/13454) for cron schedules.

## Local dev server

This project includes a local dev server to view and modify the email template based on your RSS feeds.

Start the dev server:

```bash
npm install
npm run dev
```

## Verification

- `npm run verify` runs tests, formatting checks, and typechecking
- `npm run harness` runs an end-to-end local RSS server harness against `node email.js`
- `npm run verify:full` runs both, and is the best local pre-push check

## How does it work

Rendering starts in the [`renderEmail`](src/renderEmail.tsx) function. Feed URLs are loaded from [`feeds.txt`](feeds.txt), parsed in [`parseFeeds`](src/parseFeeds.ts), filtered against the previous successful run, and rendered by the [`Email`](src/email/Email.tsx) component.

## Build on top of

- [react-email](https://github.com/resendlabs/react-email)\
  This project is what triggered me to create this repo. It is still very beta, but if we can ditch all the clunky specialized tools for creating email layouts and replace them with a React / Typescript based solution :heart:
- [vite](https://vitejs.dev/)\
  For rendering and the dev server. Had to do some hacking to get it working well with HMR and my cache implementation is :poop:. But Vite itself is :fire:
- [dawidd6/action-send-mail](https://github.com/dawidd6/action-send-mail)\
  Github Action to send out emails, just bring your own SMTP provider
