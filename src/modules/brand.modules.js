import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Brand is Requied']
    },
    brandLogo:{
        type: String,
    }
})

const Brand = mongoose.model('brand', brandSchema);

export default Brand;
