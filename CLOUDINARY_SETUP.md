# Cloudinary Branch Organization

## Overview
Images are organized in Cloudinary by branch using dedicated folders:

| Branch | Folder | Location |
|--------|--------|----------|
| **branch-1** | `f-m-elr` | Eluru |
| **branch-2** | `f-m-bvrm` | Bhimavaram |

## Image Types
Each branch folder contains subfolders for different image types:
- `cakes/` - Cake designs and variations
- `decorations/` - Decoration options and extras
- `testimonials/` - Customer testimonials and memories
- `hero/` - Hero/banner images for the website

## Examples
- Eluru cake images: `f-m-elr/cakes/`
- Bhimavaram hero images: `f-m-bvrm/hero/`
- Eluru testimonials: `f-m-elr/testimonials/`

## Implementation

### Finding Branch for Upload
The `getRootFolderForBranch()` function in `src/utils/branchConfig.js` automatically maps branch IDs to their Cloudinary folders:

```javascript
import { getRootFolderForBranch } from '../utils/branchConfig.js';

const branch = 'branch-1'; // or 'branch-2'
const cloudinaryFolder = getRootFolderForBranch(branch);
// Returns: 'f-m-elr' for branch-1, 'f-m-bvrm' for branch-2
```

### Upload Process
All uploads use the `uploadToCloudinary()` function from `src/utils/cloudinary.js`:

```javascript
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { getRootFolderForBranch } from '../utils/branchConfig.js';

const imageUrl = await uploadToCloudinary(
  base64ImageData,
  'cakes',                          // image type
  getRootFolderForBranch(branch)   // branch folder
);
```

## Routes Using This Configuration

### Catalog Routes (`src/routes/catalog.js`)
- `POST /api/catalog/cakes` - Upload cake images
- `PUT /api/catalog/cakes/:id` - Update cake images
- `POST /api/catalog/decorations` - Upload decoration images
- `PUT /api/catalog/decorations/:id` - Update decoration images

### Admin Routes (`src/routes/admin.js`)
- `PUT /api/admin/gallery/:type/:id` - Update cake/decoration images
- `POST /api/admin/gallery/testimonials` - Upload testimonial images
- `POST /api/admin/hero-images` - Upload hero/banner images

### Query Parameter
All endpoints accept a `branch` query parameter or body parameter:
```
POST /api/catalog/cakes?branch=branch-2
PUT /api/admin/gallery/cakes/cake-123?branch=branch-1
```

## Cloudinary Dashboard
- Navigate to Media Library → Folders to see the organized branch structure
- Eluru images: `f-m-elr` folder and subfolders
- Bhimavaram images: `f-m-bvrm` folder and subfolders
