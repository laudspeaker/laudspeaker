import { WorkspaceNotificationPreferencesData } from "pages/Settingsv2/tabs/MessageChannelTab";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";

const fetchUserInfo = async (customerId: string, workspaceId: string) => {
  try {
    const { data } = await ApiService.get({
      url: `/customers/notification-preferences/${customerId}/${workspaceId}`,
    });
    if (!data) toast.warn("Couldn't find customer preferences");
    return data;
  } catch (error) {
    toast.error("Error fetching user preferences");
    return null;
  }
};

const updateUserInfo = async (
  customerId: string,
  workspaceId: string,
  preferences: { id: string; subscribed: boolean }[],
  unsubscribeFromAll?: boolean
) => {
  try {
    const { data } = await ApiService.post({
      url: `/customers/notification-preferences`,
      options: { customerId, workspaceId, preferences, unsubscribeFromAll },
    });
    toast.success("Preferences updated successfully!");
    return data;
  } catch (error) {
    toast.error("Error modifying notification preferences");
    return null;
  }
};

const fetchOrganizationInfo = async (workspaceId: string) => {
  try {
    const { data } = await ApiService.get<
      WorkspaceNotificationPreferencesData[]
    >({
      url: `/notification-preferences/${workspaceId}`,
    });
    return data;
  } catch (error) {
    toast.error("Error fetching notification preferences");
    return null;
  }
};

const NotificationPreferences: React.FC = () => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const customerId = searchParams.get("customerId");
  const preferenceId = searchParams.get("preferenceId");
  const [preferences, setPreferences] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (preferenceId && workspaceId && customerId) {
      if (preferenceId === "all") {
        updateUserInfo(customerId, workspaceId, [], true);
      } else {
        updateUserInfo(customerId, workspaceId, [
          { id: preferenceId, subscribed: false },
        ]);
      }
    }
    if (workspaceId) {
      fetchOrganizationInfo(workspaceId).then((companyPreferences) => {
        if (customerId && workspaceId) {
          fetchUserInfo(customerId, workspaceId).then((userPrefs) => {
            if (userPrefs) {
              setUserPreferences(userPrefs?.unsubscribed_from || []);
            }
            if (companyPreferences) {
              const updatedPreferences = companyPreferences.map((pref) => {
                const userPref = userPrefs?.unsubscribed_from?.find(
                  (userpref: string) => userpref === pref.id
                );
                return {
                  ...pref,
                  subscribed: userPrefs?.unsubscribe_all
                    ? false
                    : userPref
                    ? false
                    : true,
                };
              });
              setPreferences(updatedPreferences);
            }
          });
        } else {
          setPreferences(
            companyPreferences?.map((pref) => {
              return {
                ...pref,
                subscribed: false,
              };
            }) || []
          );
        }
      });
    }
  }, [customerId, workspaceId]);

  const handleCheckboxChange = (id: string) => {
    setPreferences((prevPreferences) =>
      prevPreferences.map((pref) =>
        pref.id === id ? { ...pref, subscribed: !pref.subscribed } : pref
      )
    );
  };

  const handleUpdatePreferences = () => {
    if (customerId && workspaceId) {
      const preferencesToUpdate = preferences.map((pref) => ({
        id: pref.id,
        subscribed: pref.subscribed,
      }));

      updateUserInfo(customerId, workspaceId, preferencesToUpdate);
    } else {
      toast.error(
        "Unable to update preferences. Missing required information."
      );
    }
  };

  const unsubscribeFromAll = () => {
    if (customerId && workspaceId) {
      updateUserInfo(customerId, workspaceId, [], true);
    } else {
      toast.error(
        "Unable to update preferences, please refresh and try again."
      );
    }
    setPreferences((prevPreferences) =>
      prevPreferences.map((pref) => ({ ...pref, subscribed: false }))
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Communication Preferences
          </h1>
          <p className="text-sm text-gray-600">
            Manage your communication preferences below.
          </p>
        </header>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {preferences.length === 0 ? (
              <p className="text-center text-gray-500">
                No preferences available. Please try again later.
              </p>
            ) : (
              preferences.map((pref) => (
                <div
                  key={pref.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-all hover:shadow-xl"
                >
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {pref.title}
                    </h2>
                    <p className="text-sm text-gray-500">{pref.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={pref.subscribed}
                      onChange={() => handleCheckboxChange(pref.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 text-center space-x-24">
            <button
              onClick={handleUpdatePreferences}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md text-lg font-semibold shadow-md hover:bg-indigo-700 transition"
            >
              Update Preferences
            </button>
            <button
              onClick={unsubscribeFromAll}
              className="bg-red-600 text-white px-6 py-2 rounded-md text-lg font-semibold shadow-md hover:bg-red-700 transition"
            >
              Unsubscribe from All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
