import Header from "../../components/Header";
import ProfileForm from "./components/ProfileForm";

const Profile = () => {
  return (
    <>
      <div className="flex-col">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Profile
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
                  <h2>My Settings</h2>
                  <ProfileForm />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
