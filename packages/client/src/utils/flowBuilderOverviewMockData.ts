enum UserStatus {
  ENROLLED = "Enrolled",
  FINISHED = "Finished",
}

const getUsers = () => {
  const users = [
    {
      customerId: "641470155276ebb795145142",
      email: "341dfa23432@gmail.com",
      status: UserStatus.ENROLLED,
      lastUpdate: "2024-02-29T09:52:20.990Z",
    },
    {
      customerId: "641470155276ebb795145143",
      email: "341dfa23433@gmail.com",
      status: UserStatus.ENROLLED,
      lastUpdate: "2024-02-28T09:52:20.990Z",
    },
    {
      customerId: "641470155276ebb795145144",
      email: "341dfa23434@gmail.com",
      status: UserStatus.ENROLLED,
      lastUpdate: "2024-02-27T09:52:20.990Z",
    },
    {
      customerId: "641470155276ebb795145145",
      email: "341dfa23435@gmail.com",
      status: UserStatus.FINISHED,
      lastUpdate: "2024-02-26T09:52:20.990Z",
    },
  ];

  return {
    data: {
      data: users,
      totalPages: 1,
    },
  };
};

const legendValues = [
  {
    title: "A",
    percentage: 60.12,
    conversionRate: 600,
    color: "#6366F1",
  },
  {
    title: "B",
    percentage: 60.12,
    conversionRate: 12,
    color: "#0EA5E3",
  },
  {
    title: "C",
    percentage: 60.12,
    conversionRate: 1200,
    color: "#EAB308",
  },
  {
    title: "D",
    percentage: 60.12,
    conversionRate: 234124234,
    color: "#22C55E",
  },
  {
    title: "E",
    percentage: 60.12,
    conversionRate: 3400,
    color: "#111827",
  },
];
export { getUsers, UserStatus, legendValues };
