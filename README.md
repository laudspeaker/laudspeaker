
## 🚀 Laudspeaker's mission and roadmap

Our mission is to build a new, open source suite of software tools to completely handle the "customer journey". After successful launches on Product Hunt and on HN, we've been inundated with demand for our products and are building as fast as possible to keep up. We have a very ambitious roadmap, and are focusing on going broad first on features, before we go deep.

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

<table>
<tr>
  <th>Q2</th>
  <th>Q3</th>
</tr>
<tr>
  <td>

<table>
  <tbody>
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
    
  </tbody>
</table>

  </td>
<td>

<table>
  <tbody>
    <tr>
      <td align="left" valign="middle">
          ✔️ SMS (via Twilio)
      </td>
      <td align="left" valign="middle">
          🔜️  Email (via  Smtp)
      </td>
      <td align="left" valign="middle">
          ✔️  Push (via Firebase Push)
      </td>
    </tr>
    <tr>
      <td align="left" valign="middle">
          🔜️
      </td>
      <td align="left" valign="middle">
          🔜️  Push (via APNS)
      </td>
      <td align="left" valign="middle">
          🔜️  Push ( React Native)
      </td>
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

</td>       
</tr>
</table>

## 

## 🌱 How we hire




