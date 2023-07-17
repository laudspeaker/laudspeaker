<p align="center"><a  href="https://laudspeaker.com/?ref=github"><img  src="https://user-images.githubusercontent.com/7728266/194206039-0faecc9d-c500-4c64-8401-dfbefe501e4a.png"  height="100"/></a></p>

<p align="center">
<a href='https://laudspeakerusers.slack.com/ssb/redirect'><img alt="Join Slack Community" src="https://img.shields.io/badge/slack%20community-join-green"/></a>
<a href='https://twitter.com/laudspeaker'><img alt="Follow Laudspeaker" src="https://img.shields.io/badge/%40laudspeaker-follow-blue"/></a>
<a href='https://img.shields.io/github/commit-activity/m/laudspeaker/laudspeaker'><img alt="Commits" src="https://img.shields.io/github/commit-activity/m/laudspeaker/laudspeaker"/></a>
<a href='https://hub.docker.com/repository/docker/laudspeaker/laudspeaker'><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/laudspeaker/laudspeaker"></a>

<h4 align="center">
  <a href="https://join.slack.com/t/laudspeakerusers/shared_invite/zt-1li25huaq-BljJUA1Zm8dXvbZViAbMwg">Slack</a> |
  <a href="https://app.laudspeaker.com/login/?ref=github">Laudspeaker Cloud</a> |
  <a href="https://laudspeaker.com/docs/guides/category/deploy/?ref=github">Self-Hosting</a> |
  <a href="https://laudspeaker.com/docs/guides/overview/intro/?ref=github">Docs</a> |
  <a href="https://laudspeaker.com/?ref=github">Website</a>
</h4>
  
</p>

## Laudspeaker - Open source omni-channel customer messaging. Alternative to Braze / Iterable / One Signal / Customer Io

<img width="1708" alt="UI2" src="https://github.com/laudspeaker/laudspeaker/assets/7728266/4c3c2917-6899-48f7-bcbe-a4bd92049c24">

- **Multiple messaging channels like email, sms and push** Send product or event-triggered emails, sms and more to your customers and users at scale
- **Visual Journey Builder** Build complex messaging workflows the whole team can understand in a visual tool, and see stats once a journey is started
- **Run on your own infra** Deploy and run on your own infrastructure to keep control of your data.
- **Integrate with PostHog analytics** Easily trigger journeys with PostHog, the open source product analytics platform
- **Easy WYSIWYG Template builder** Build nice emails and more with our template builder
- **1-Click Deploy** to Render
- **Database / datalake / data warehouse import** ingest user data from your databases
- **Build and save segments of users**
- **Build custom modals with our modal designer**
- 🔜 **Custom User onboarding components that can be added to journeys**
- 🔜 **Trigger journeys from segment/rudderstack/mixpanel events**
- 🔜 **Comprehensive versioning ** - simulate user actions, differents dates, and times and test and debug messages before you start journeys

## 🚀 Get Started

Run yourself (instructions below) or use [Laudspeaker Cloud](https://app.laudspeaker.com/login/?ref=github) . Docs are [here](https://laudspeaker.com/docs/guides/overview/intro/?ref=github)

### Deploy Laudspeaker on Render.com

If you want a one-click render option **READ THIS** <a href="https://laudspeaker.com/docs/guides/deploy/options/?ref=github">**DOC**</a> and try it out here:

NB: Create environment group with name "laudspeaker"

<a href="https://render.com/deploy?repo=https://github.com/laudspeaker/laudspeaker/tree/production">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render">
</a>

### Want help deploying?

<a href="https://cal.com/laudspeaker-mahamad/20min-set-up" target="_blank"><img src="https://user-images.githubusercontent.com/7728266/226135023-e484e408-4434-4282-ae66-5c224fb65e20.png" /> </a>

### Setting up with docker:

Run services:

- `docker-compose up` or `docker compose up` depending on your version of docker

Instantiate Mongo:

- `mongosh --eval "rs.initiate()"`

Run backend and front end:

- `npm install`
- `npm run start`

To stop running system services (Linux):

- Postgres: `sudo systemctl stop postgresql.service`
- Redis: `/etc/init.d/redis-server stop`
- Mongo: `sudo systemctl stop mongod`

To remove compose containers:

- `docker-compose down --volumes`

Add a `.env` file to both `packages/server` and `packages/client`.

We have provided examples which you can use:

`mv env-server-example packages/server/.env` and `mv env-client-example packages/client/.env`

Make sure you fill in the fields in the env files before running.

Questions? Please join our [Slack channel](https://join.slack.com/t/laudspeakerusers/shared_invite/zt-1io0f6u50-rSCnNtqkJT6QIdbPOyJh6g) or visit our [site](https://laudspeaker.com/).

## 🔥 What makes Laudspeaker cool?

Lauspeaker is the only multi-channel open-source customer messaging workflow software, which is focused on being event triggered, has been built with a visual journey feature from day one and is focused on scalability.

We support email, sms and slack as a channel and have many more channels on our roadmap.

We are planning to build Laudspeaker to work well with the Modern Data Stack, integrating with data warehouses and other services so you can easily import and export data with no fear of lock in or losing control of your data.

## 🐥 Status

- [x] Public Alpha: Anyone can sign up over at [laudspeaker.com](https://laudspeaker.com) but go easy on us, there are wrinkles and we're just getting started.
- [ ] Public Beta: Stable enough for most non-enterprise use-cases.
- [ ] Public: Production-ready.

We're currently in Public Alpha.

## License

**Laudspeaker** is open source and released under the [MIT License][mit_license], and AGPLv3 licenses (code in separate directories) with the exception of our ee directory (which is currently empty!) but will be under the Laudspeaker Enterprise Edition license. If you can only use MIT licencsed code, you can still use Laudspeaker but with a few fewer features.

## 🌱 Contribute

We would love to see you contribute to Laudspeaker. Join our slack to get involved.

A quick how to for contribution:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/some-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Implement an amazing feature.'`)
5. Push to the branch (`git push origin feature/some-feature`)
6. Open a pull request

## 🎥 Video Walkthrough

- Check out how to set up and trigger an email with posthog in our [video](https://vimeo.com/763728112)
- Check out how to trigger a slack message with a custom event in this [video](https://www.loom.com/share/8e1d349ceed24d2bb50280db36b19214)

## Follow Us

- [Slack][slack]

[slack]: https://join.slack.com/t/laudspeakerusers/shared_invite/zt-1li25huaq-BljJUA1Zm8dXvbZViAbMwg
[twitter]: https://twitter.com/laudspeaker
[mit_license]: https://opensource.org/licenses/MIT

## We’re hiring!

Come help us make Laudspeaker better. Email us at hey [at] laudspeaker [dot] com

If you're interested have a look at this repo and feel free to raise an issue!

<!---
-  [Laudspeaker Blog][laudspeaker-blog]

-  [LinkedIn][linkedin]

-  [dev.to][devto]

-  [Medium][medium]

-  [YouTube][youtube]

-  [HackerNews][hackernews]

-  [Product Hunt][producthunt]
-->

<!---[devto]: https://dev.to/rudderstack
[youtube]: https://www.youtube.com/channel/UCgV-B77bV_-LOmKYHw8jvBw
[laudspeaker-blog]: https://laudspeaker.com/blog/
[hackernews]: https://news.ycombinator.com/
[producthunt]: https://www.producthunt.com/posts/laudspeaker
[agplv3_license]: https://www.gnu.org/licenses/agpl-3.0-standalone.html
[laudspeaker_ee_license]: https://www.mongodb.com/licensing/server-side-public-license

-->
