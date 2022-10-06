# laudspeaker API
run services:
docker-compose up

run backend and front end:
npm install
npm run start

stop all running services:
postgres: sudo systemctl stop postgresql.service
redis: /etc/init.d/redis-server stop
mongo: sudo systemctl stop mongod

remove compose conatiners
 docker-compose down --volumes


<p align="center"><a  href="https://laudspeaker.com/"><img  src="https://user-images.githubusercontent.com/7728266/194206039-0faecc9d-c500-4c64-8401-dfbefe501e4a.png"  alt="Laudspeaker - Open Source Customer Messaging Workflows"  height="50"/></a></p>


<p align="center"><b>Open source customer messaging and notification workflow software</b></p>

<br/>

#  Laudspeaker PostHog Plugin

## Send events from PostHog to Laudspeaker

Questions? Please join our [Slack channel](https://laudspeakerusers.slack.com/ssb/redirect) or visit our [site](https://laudspeaker.com/).

<br>

  
### Get Started

 - To experience the full power of laudspeaker we recommend you import your posthog users first via the event integration on [laudspeakers application] 
 (https:/loom.com/).
   
 - After configuring posthog on our application, install the plugin, and provide your api for `write-key`, 
 - provide [your_server's_url]/events/posthog for `Lauspeaker URL` (or if using our hosted plan just use app.laudspeaker.com/events/posthog). The other fields are optional
 - Then enable the plugin and you should start seeing events sent to laudspeaker 

### License

**Laudspeaker PostHog Plugin** is released under the [MIT License][mit_license].

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
