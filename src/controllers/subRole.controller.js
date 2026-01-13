import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createSubRole,
  querySubRoles,
  getSubRoleById,
  updateSubRoleById,
  deleteSubRoleById,
} from '../services/subRole.service.js';

const create = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const subRole = await createSubRole(req.body, createdById);
  res.status(httpStatus.CREATED).send(subRole);
});

const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await querySubRoles(filter, options);
  res.send(result);
});

const get = catchAsync(async (req, res) => {
  const subRole = await getSubRoleById(req.params.subRoleId);
  if (!subRole) {
    return res.status(httpStatus.NOT_FOUND).send({ code: 404, message: 'SubRole not found' });
  }
  res.send(subRole);
});

const update = catchAsync(async (req, res) => {
  const subRole = await updateSubRoleById(req.params.subRoleId, req.body);
  res.send(subRole);
});

const remove = catchAsync(async (req, res) => {
  await deleteSubRoleById(req.params.subRoleId);
  res.status(httpStatus.NO_CONTENT).send();
});

export {
  create,
  list,
  get,
  update,
  remove,
};
