import Pincode from "../modules/service_pincode.modules.js";

export const addPincode = async(req, res) =>{
    try {
        const { pincode, status } = req.body;
        let pincodes = new Pincode({ pincode, status });
        let isPincode = await Pincode.find({pincode});
        if(!isPincode){
            await pincodes.save();
            res.status(200).json({
                success: true,
                message: "pincode added successfully",
                data: pincodes
            });
        }
      
    } catch (error) {
        
    }
}

export const getPincode = async(req, res) =>{
    try {
        let pincode = await Pincode.find().populate('_id');
        console.log('pincode', pincode);
        res.status(200).json({
            success: true,
            message: "Pincode fetched successfully",
            data: pincode
        })
        
    } catch (error) {
        
    }
}