/**
 * Branch Configuration Utilities
 * Maps branch IDs to their corresponding Cloudinary folders and display names
 */

/**
 * Get the Cloudinary root folder for a branch
 * @param {string} branchId - The branch ID ('branch-1' or 'branch-2')
 * @returns {string} The corresponding Cloudinary folder ('f-m-elr' or 'f-m-bvrm')
 */
export const getRootFolderForBranch = (branchId) => {
  switch (branchId) {
    case 'branch-2':
      return 'f-m-bvrm'; // Bhimavaram branch
    case 'branch-1':
    default:
      return 'f-m-elr'; // Eluru branch (default)
  }
};

/**
 * Get the display name for a branch
 * @param {string} branchId - The branch ID
 * @returns {string} The branch display name
 */
export const getBranchName = (branchId) => {
  switch (branchId) {
    case 'branch-2':
      return 'Bhimavaram';
    case 'branch-1':
    default:
      return 'Eluru';
  }
};

/**
 * Get branch information (ID, name, and Cloudinary folder)
 * @param {string} branchId - The branch ID
 * @returns {Object} Branch information object
 */
export const getBranchInfo = (branchId) => ({
  id: branchId,
  name: getBranchName(branchId),
  cloudinaryFolder: getRootFolderForBranch(branchId),
});
