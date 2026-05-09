export type OrgTreeNode = {
  id: string;
  name: string;
  title: string;
  department: string;
  children?: OrgTreeNode[];
};

export const sampleOrgTree: OrgTreeNode = {
  id: "exec-1",
  name: "Alex Rivera",
  title: "Chief People Officer",
  department: "Executive",
  children: [
    {
      id: "hrbp-1",
      name: "Priya Desai",
      title: "HR Business Partner — Product",
      department: "People Partnering",
      children: [
        {
          id: "mgr-1",
          name: "Jordan Lee",
          title: "Engineering Manager",
          department: "Product Engineering",
          children: [
            {
              id: "ic-1",
              name: "Sam Carter",
              title: "Senior Software Engineer",
              department: "Product Engineering",
            },
            {
              id: "ic-2",
              name: "Riley Cho",
              title: "People Operations Specialist",
              department: "Product Engineering",
            },
          ],
        },
      ],
    },
    {
      id: "hrbp-2",
      name: "Morgan Ellis",
      title: "HR Business Partner — GTM",
      department: "People Partnering",
      children: [
        {
          id: "mgr-2",
          name: "Casey Nguyen",
          title: "Revenue Operations Lead",
          department: "Revenue",
        },
      ],
    },
  ],
};
