import Header from "../../components/Header";
import ProfileForm from "./components/ProfileForm";

const Profile = () => {
  return (
    <>
      <div className="flex-col">
        <Header />
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

    // <Box
    //   sx={{
    //     position: "relative",
    //     width: "100%",
    //     backgroundColor: "#E5E5E5",
    //     display: "flex",
    //     flexDirection: "column",
    //     height: "100vh",
    //     overflow: "auto",
    //     "& .MuiTypography-root": {
    //       fontFamily: "Inter",
    //     },
    //     "& .MuiInputBase-input": {
    //       background: "#fff",
    //       border: "1px solid #D1D5DB",
    //       fontFamily: "Inter",
    //       fontWeight: 400,
    //       fontSize: "16px",
    //       padding: "12px 16px",
    //       "&:disabled": {
    //         background: "#EEE !important",
    //       },
    //     },
    //     "& .MuiInputLabel-root": {
    //       fontSize: "16px",
    //       fontFamily: "Inter",
    //     },
    //     "& .MuiFormControl-root": {
    //       maxWidth: "529px",
    //     },
    //   }}
    // >
    //   <Header />
    //   <Box
    //     sx={{
    //       display: "flex",
    //       flexDirection: "column",
    //       paddingLeft: "10%",
    //       paddingTop: "70px",
    //       justifyContent: "center",
    //       alightItems: "center",
    //       width: "100%",
    //     }}
    //   >
    //     <Box
    //       sx={{
    //         paddingLeft: "25px",
    //         paddingRight: "25px",
    //         minHeight: "calc(100vh - 162px)",
    //         maxWidth: "930px",
    //         width: "90%",
    //         background: "#FFFFFF",
    //         borderRadius: "20px",
    //       }}
    //     >
    //       <h2>My Settings</h2>
    //       <ProfileForm />
    //     </Box>
    //   </Box>
    // </Box>
  );
};

export default Profile;
