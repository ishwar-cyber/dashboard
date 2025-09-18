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
}, { timestamps: true, toJSON: { virtuals: true } });
pincodeSchema.set('toJSON', 
    { virtuals: true, 
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
);
const Pincode = mongoose.model('Pincode', pincodeSchema);

export default Pincode;