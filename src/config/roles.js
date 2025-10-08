const allRoles = {
  user: ['getCandidates'],
  admin: ['getUsers', 'manageUsers', 'getCandidates', 'manageCandidates'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

export { roles, roleRights };
