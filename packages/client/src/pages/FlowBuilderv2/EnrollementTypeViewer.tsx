import React, { FC } from "react";
import { JourneyEnrollmentType } from "reducers/flow-builder.reducer";

interface EnrollmentTypeViewerProps {
  enrollmentType: JourneyEnrollmentType;
}

const EnrollmentTypeViewer: FC<EnrollmentTypeViewerProps> = ({
  enrollmentType,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Enrollment type
      </div>
      <div>
        {enrollmentType === JourneyEnrollmentType.CurrentAndFutureUsers ? (
          <>Enroll current users and future matching users</>
        ) : enrollmentType === JourneyEnrollmentType.OnlyCurrent ? (
          <>
            Only enroll <b>current</b> users
          </>
        ) : enrollmentType === JourneyEnrollmentType.OnlyFuture ? (
          <>
            Only enroll <b>future</b> matching users
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default EnrollmentTypeViewer;
