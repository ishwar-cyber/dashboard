import mongoose from "mongoose";

const pincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[1-9][0-9]{5}$/.test(v); // Indian pincodes are 6 digits starting with 1-9
      },
      message: props => `${props.value} is not a valid Indian pincode!`
    }
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

// Index for faster queries
pincodeSchema.index({ pincode: 1 });
pincodeSchema.index({ district: 1 });
pincodeSchema.index({ state: 1 });

const Pincode = mongoose.model('Pincode', pincodeSchema);

export default Pincode;