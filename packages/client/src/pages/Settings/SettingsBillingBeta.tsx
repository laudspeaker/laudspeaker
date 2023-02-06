import AlertBanner from "components/AlertBanner";

export default function SettingsBillingBeta() {
  return (
    <>
      <div className="mt-10 divide-y divide-gray-200">
        <AlertBanner title="No Payment Methods">
          You are currently using a free version of Laudspeaker, which comes
          with 1000 free messages per month. To get more, add a payment method
          or upgrade to one of our paid plans.
        </AlertBanner>
      </div>
    </>
  );
}
