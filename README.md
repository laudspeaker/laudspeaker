
## 🚀 Laudspeaker's mission and roadmap

Our mission is to build a new, open source suite of software tools to completely handle the "customer journey". After successful launches on Product Hunt and on HN, we've been inundated with demand for our products and are building as fast as possible to keep up. We have a very ambitious roadmap, our team is small but mighty, and we are looking for people who can ship high quality code quickly, who take immense pride in their work, and love open source to join us.

In terms of how we think about product we categorise our work into 4 major buckets. 

- Reaching feature parity with our competitors
- Responding to customer requests
- Making big bets
- Building a scalable system

Here's a more detailed breakdown of the state of the product, and what parity means.

<table>
<tr>
  <th>Journey Builder </th>
  <th>Channels</th>
  <th>Data Integrations</th>
</tr>
<tr>
  <td>

<table>
  <tbody>
    <tr>
      <td align="left" valign="middle">
        <a href="https://laudspeaker.com/docs/guides/product-manual/Journey-Builder">
          ✔️ Triggers ( Event Triggers)
        </a>
      </td>
      <td align="left" valign="middle">
        <a href="https://laudspeaker.com/docs/guides/product-manual/Journey-Builder">
          ✔️  Triggers (Time Delays)
        </a>
      </td>
      <td align="left" valign="middle">
          ✔️ Triggers ( Time Windows)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
         🔜 Triggers (Message Events)
      </td>
      <td align="left" valign="middle">
          ✔  Triggers (Looping)
      </td>
      <td align="left" valign="middle">
         🔜 
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          🔜️ Branching ( True / False) 
      </td>
      <td align="left" valign="middle">
          ✔️ Branching ( Multi Branching)
      </td>
      <td align="left" valign="middle">
          🔜️ Branching ( Random Branching)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
        ✔ Segmentation (User Attributes)
      </td>
      <td align="left" valign="middle">
        🔜️ Segmentation (User Attribute Change History)
      </td>
      <td align="left" valign="middle">
        🔜 Segmentation (Event History)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
        ✔ Metrics (email open rate)
      </td>
      <td align="left" valign="middle">
        ✔ Metrics (email click through rate)
      </td>
      <td align="left" valign="middle">
        🔜 Metrics (step to step conversion)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
         🔜 A/B Tests v1
      </td>
      <td align="left" valign="middle">
          ✔ Personalization (Liquid)
      </td>
      <td align="left" valign="middle">
         🔜 Webhooks
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
         🔜 Journey Simulator
      </td>
      <td align="left" valign="middle">
          🔜 Journeys as code
      </td>
      <td align="left" valign="middle">
         And other cool things..
      </td>
    </tr>
    
  </tbody>
</table>

  </td>
<td>

<table>
  <tbody>
    <tr>
      <td align="left" valign="middle">
          ✔️ Email (via  Mailgun)
      </td>
      <td align="left" valign="middle">
          ✔️  Email (via  Sendgrid)
      </td>
            <td align="left" valign="middle">
          🔜️  Email (via  Smtp)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          ✔️ SMS (via Twilio)
      </td>
      <td align="left" valign="middle">
          🔜️
      </td>
      <td align="left" valign="middle">
          🔜️
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          ✔️  Push (via Firebase Push)
      </td>
      <td align="left" valign="middle">
          🔜️  Push (via APNS)
      </td>
      <td align="left" valign="middle">
          🔜️  Push ( React Native)
      </td>
    </tr>
    </tr>
    <tr>
      <td align="left" valign="middle">
          🔜️ In App (web modals)
      </td>
      <td align="left" valign="middle">
          🔜️  In App (banners)
      </td>
      <td align="left" valign="middle">
          🔜️  In App (content cards
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          🔜  Webhook
      </td>
      <td align="left" valign="middle">
        And more...
      </td>
      <td align="left" valign="middle">
        And Even more...
      </td>
    </tr>
  </tbody>
</table>

</td>
<td>

<table>
  <tbody>
    <tr>
      <td align="left" valign="middle">
          ✔️ Product Events (via PostHog)
      </td>
      <td align="left" valign="middle">
          ✔️  Product Events (via Custom Endpoint)
      </td>
            <td align="left" valign="middle">
          🔜️   Product Events (via Amplitude)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          🔜️ Customer Data Platform (Segment)
      </td>
      <td align="left" valign="middle">
          🔜️ Customer Data Platform (Rudderstack)
      </td>
      <td align="left" valign="middle">
          🔜️
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          ✔️  Data Warehouse (Databricks)
      </td>
      <td align="left" valign="middle">
          🔜️  Data Warehouse (Snowflake)
      </td>
            <td align="left" valign="middle">
          🔜️  Data Warehouse (Snowflake)
      </td>
    </tr>
    </tr>
    <tr>
      <td align="left" valign="middle">
          ✔️ Database (Postgres)
      </td>
      <td align="left" valign="middle">
        And more...
      </td>
      <td align="left" valign="middle">
        And Even more...
      </td>
    </tr>
  </tbody>
</table>

</td>       
</tr>
</table>

We are focused on the first two buckets of work right now (reaching feature parity, and responding to our customers), and to achieve them we roughly need to build everything in the "soon" category quickly and well.

## 🌱 How we hire

The advantage of building an open source product and company is the code base is there for everyone to see! As a first step we encourage all would be candidates to 
- Sign up and play around with Laudspeaker cloud 
- Have a look at our code base (the production and staging branches are your friends) 
- Watch, follow, and star to keep up with updates
- Raise an issue or two
- Join our slack group
- Fix those issues, submit a PR
- Send us an email, and let us know what we can improve

We are looking for proactive developers who take pride in their work and can ship high quality code quickly, and we think one of the best ways of seeing that is through contributions!

- If there's a fit we'll email you back, and set up time for a call with one of the founders
- After that we'll typically engage in a paid trial work period, after which we both have the chance to decide whether to work together!

## A quick how to for contribution:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/some-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Implement an amazing feature.'`)
5. Push to the branch (`git push origin feature/some-feature`)
6. Open a pull request

## Roles we are looking for right now

Right now we are looking for two senior engineers.

### Product Engineer

Some characteristics you may share:
- You obsess over how our users interact with our product, are experienced with front end technologies and love talking to users
- You proactively figure out how to make our product "feel" better and can take vague requests and get them done without needing too much help
- You love the challenge of working on complex drag and drop editors and no code tools, and think building software like webflow, figma, or lucidchart is interesting
- You are excited by the idea of having a big say in the product direction

Previous experience could include:
- Working as one of the first engineers at a growing startup, where you built a major part of the product from scratch
- Working on a no code tool
- You have a portfolio of work we can see

Technologies you should be familiar with:
- React, node, typescript

### Backend Engineer

Some characteristics you may share:
- You are excited to build a distributed system with job queues, and parallelization that can handle sending millions of customer messages a second. 
- Building and maintaining a system for integrations for novel customer messaging channels, product analytics systems, and customer data sources 
- Building developer tooling for first-in-class "journey testing" 
- Testing and helping build determinism in the system consistent with our state machine like architecture

Previous experience could include:
- Building APIs that went from processing 1000s to 1000000s of requests a second

Technologies you should be familiar with:
- Typescript, job queues, postgres

### Some Other Details:

- We work in Typescript with Nest.js for the backend and react for the frontend - We use technologies like: clickhouse, postgres, bullmq, docker, mongo - technologies we will likely use soon: kafka, celery, temporal - We are a remote team out of NY/Mountain View and Ukraine (and are open to gmt +2 to gmt + 8 timezones) - Did we mention we are open source :D. We raised our seed round from top tier investors (including YC) and will announce the funding in a future press release.



