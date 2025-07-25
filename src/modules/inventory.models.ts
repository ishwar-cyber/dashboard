import mongoose from "mongoose";

const Schema = mongoose.Schema;

const StockTransactionSchema = new Schema(
    {
        type:{
            type: String,
            enum:['purchase', 'sale','return'],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        date:{
            type: Date,
            default: Date.now
        },
        referenceId:{
            type: Schema.Types.ObjectId,
            refPath: 'referenceModel' 
        },
        referenceModel:{
            type: String,
            enum:['PurchaseOrder', 'Order']
        },
        notes: String,
        createBy:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },{timestamps : true});

const InventorySchema = new Schema(
    {
        product:{
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Product'
        },
        sku:{
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        quantity:{
            type: Number,
            default: 0,
            min:0
        },
        availableQuantity:{
            type: Number,
            default: 0,
            min:0
        },
        reverQuantity:{
            type: Number,
            default: 0,
            min:0
        },
        reorderPoint:{
            type: Number,
            default: 5,
            min: 0
        },
        reorderQuantity:{
            type: Number,
            default: 10,
            min: 0
        },
        location:{
            type: String,
            trim: true
        },
        lastStockTake: {
            type: Date
        },
        transactions:[StockTransactionSchema],
        isActive:{
            type: Boolean,
            default: true
        }
    },{
        timestamps: true,
        toJSON:{virtuals: true},
        toObject:{virtuals: true}
    });


    InventorySchema.index({product: 1});
    InventorySchema.index({sku: 1});


    InventorySchema.virtual('status').get(function(){
        if(this.quantity<=0){
            return 'Out_of_stock';
        } else if(this.quantity<= this.reorderPoint){
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    });

const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;
