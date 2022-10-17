import Header from "components/Header";
import React from "react";
import EmailForm from "./components/EmailForm/EmailForm";
import SlackForm from "./components/SlackForm/SlackForm";

const Integrations = () => {
  return (
    <>
      <div className="flex-col">
        <Header />
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Email
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 pd-5">
            <form action="#" method="POST">
              <div className="shadow sm:overflow-hidden sm:rounded-md">
                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                  <h2>Email configuration</h2>
                  <EmailForm />
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="md:grid md:grid-cols-3 md:gap-6 border-t-[1px]">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Slack
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 pd-5">
            <form action="#" method="POST">
              <div className="shadow sm:overflow-hidden sm:rounded-md">
                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                  <h2>Slack configuration</h2>
                  <SlackForm />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Integrations;
