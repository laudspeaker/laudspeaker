import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

export default function SettingsBillingBeta() {
  return (
    <>
      <div className="mt-10 divide-y divide-gray-200">
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon
                className="h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Payment Methods
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You are currently using a free version of Laudspeaker, which
                  comes with 1000 free messages per month. To get more, add a
                  payment method or upgrade to one of our paid plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
