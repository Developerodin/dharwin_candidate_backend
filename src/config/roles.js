const allRoles = {
  user: ['getCandidates'],
  admin: ['getUsers', 'manageUsers', 'getCandidates', 'manageCandidates', 'getLoginLogs'],
  supervisor: ['getCandidates', 'manageCandidates', 'getUsers'],
  recruiter: ['getCandidates', 'manageCandidates'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

export { roles, roleRights };
