const people = [
  {
    name: "You",
    title: "",
    role: "Admin",
    email: "janecooper@example.com",
    telephone: "+1-202-555-0170",
    imageUrl: "",
  },
  // More people...
];

export default function SettingsTeamBeta() {
  return (
    <>
      <div className="mt-10 divide-y divide-gray-200">
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {people.map((person) => (
            <li
              key={person.email}
              className="col-span-1 rounded-lg bg-white shadow"
            >
              <div className="flex w-full items-center justify-between space-x-6 p-6">
                <div className="flex-1 truncate">
                  <div className="flex items-center space-x-3">
                    <h3 className="truncate text-sm font-medium text-gray-900">
                      {person.name}
                    </h3>
                    <span className="inline-block flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      {person.role}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {person.title}
                  </p>
                </div>
                <img
                  className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300"
                  src={person.imageUrl}
                  alt=""
                />
              </div>
              <div>
                <div className="-mt-px flex">
                  <div className="flex w-0 flex-1"></div>
                  <div className="-ml-px flex w-0 flex-1"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-10 divide-y divide-gray-200">
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:pt-5">
              <span className="flex-grow">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-md border border-transparent bg-cyan-200 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md bg-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-900 focus:ring-offset-2"
                >
                  + Add (Coming Soon!)
                </button>
              </span>
            </div>{" "}
          </dl>
        </div>
      </div>
    </>
  );
}
