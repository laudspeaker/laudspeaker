import Header from "components/Header";
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="">
        <div className="mx-auto flex flex-col">
          <Header />
          <main>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="pt-10 pb-16">
                <div className="px-4 sm:px-6 md:px-0">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Welcome home
                  </h1>
                </div>
                <div className="px-4 sm:px-6 md:px-0">
                  <div className="py-3">
                    Jump back in where you left off, or start a new journey!
                  </div>
                </div>
                <div className="w-full bg-white flex rounded-md items-stretch justify-center mt-[80px]">
                  <div
                    className="w-1/2 border-r-[1px] border-r-[#E8EAED] p-[20px] cursor-pointer hover:bg-gray-100"
                    onClick={() => navigate("/onboarding")}
                  >
                    <div className="h-[80px] flex justify-between items-start">
                      <div className="text-[#518983] bg-[#F2FDFA] w-10 h-10 rounded-md flex justify-center items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-[#D2D5DA]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Complete onboarding
                      </h1>
                      <ol className="list-decimal pl-[10px] py-[10px] text-[#A8ABB3]">
                        <li>Add messaging channels</li>
                        <li>Set up events</li>
                        <li>Optionally add customers</li>
                      </ol>
                    </div>
                  </div>
                  <div
                    className="w-1/2 p-[20px] cursor-pointer hover:bg-gray-100"
                    onClick={() => navigate("/flow")}
                  >
                    <div className="h-[80px] flex justify-between items-start">
                      <div className="text-[#7635C7] bg-[#F9F5FE] w-10 h-10 rounded-md flex justify-center items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                          />
                        </svg>
                      </div>
                      <div className="text-[#D2D5DA]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Create a journey
                      </h1>
                      <p className="text-[#A8ABB3] py-[10px]">
                        Move on and create your first journey.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Home;
