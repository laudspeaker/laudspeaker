<p align="center"><a  href="https://laudspeaker.com/"><img  src="https://user-images.githubusercontent.com/7728266/194206039-0faecc9d-c500-4c64-8401-dfbefe501e4a.png"  height="100"/></a></p>

<a href='https://laudspeakerusers.slack.com/ssb/redirect'><img alt="Join Slack Community" src="https://img.shields.io/badge/slack%20community-join-green"/></a>

## Laudspeaker - Open Source, Self hostable Customer Messaging Workflows for Developers
* Send product or event-triggered emails, slack and more to your customers and users at scale
* Build complex messaging workflows the whole team can understand in a visual tool
* Deploy and run on your own infrastructure to keep control of your data.

### Get Started

Run yourself (instructions below) or use [Laudspeaker Cloud](https://app.laudspeaker.com/login) . Docs are [here](https://laudspeaker.com/docs/guides/overview/intro/)

run services:
- `docker-compose up` or `docker compose up` depending on your version of docker

run backend and front end:
- `npm install`
- `npm run start`

stop all running services:
- `postgres: sudo systemctl stop postgresql.service`
redis: 
- `/etc/init.d/redis-server stop`
- `mongo: sudo systemctl stop mongod`

remove compose conatiners:
- `docker-compose down --volumes`

Add a `.env` file to both server and client in packages

We have provided examples which you can use: 

`mv env-server-example packages/server/.env` and  `mv env-client-example packages/server/.env` 

Make sure you fill in the fields in the env files before trying to run laudspeaker

Questions? Please join our [Slack channel](https://laudspeakerusers.slack.com/ssb/redirect) or visit our [site](https://laudspeaker.com/).

### Key Features

Description coming soon!

### What makes Laudspeaker cool?

Lauspeaker is the only multi-channel open-source customer messaging workflow software, which is focused on being event triggered, has been built with a visual journey feature from day one and is focused on scalability.

We support slack as a channel and have many more channels on our roadmap.

We are planning to build Laudspeaker to work well with the Modern Data Stack, integrating with data warehouses and other services so you can easily import and export data with no fear of lock in or losing control of your data.

### License

**Laudspeaker** is open source and released under the [MIT License][mit_license], and AGPLv3 licenses (code in separate directories) with the exception of our ee directory (which is currently empty!) but will be under the Laudspeaker Enterprise Edition license. If you can only use MIT licencsed code, you can still use Laudspeaker but with a few fewer features.

### Contribute 

We would love to see you contribute to Laudspeaker. Join our slack to get involved

### Follow Us

-  [Slack][slack]

-  [Twitter][twitter]

[slack]: https://laudspeakerusers.slack.com/ssb/redirect
[twitter]: https://twitter.com/laudspeaker
[mit_license]: https://opensource.org/licenses/MIT

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
