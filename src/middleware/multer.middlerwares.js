import multer from "multer";
import path from "path";

import { storage } from '../utilities/cloudnary.js'
const upload = multer({ storage });

export default upload;