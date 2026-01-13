import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const subRoleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    navigation: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
subRoleSchema.plugin(toJSON);
subRoleSchema.plugin(paginate);

/**
 * Check if subRole name is taken
 * @param {string} name - The subRole name
 * @param {ObjectId} [excludeSubRoleId] - The id of the subRole to be excluded
 * @returns {Promise<boolean>}
 */
subRoleSchema.statics.isNameTaken = async function (name, excludeSubRoleId) {
  const subRole = await this.findOne({ name, _id: { $ne: excludeSubRoleId } });
  return !!subRole;
};

/**
 * @typedef SubRole
 */
const SubRole = mongoose.model('SubRole', subRoleSchema);

export default SubRole;
