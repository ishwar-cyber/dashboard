import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Category is Requied']
    },
   categoryLogo:{
        type: String,
    }
})

const Category = mongoose.model('categories', categorySchema);

export default Category;
