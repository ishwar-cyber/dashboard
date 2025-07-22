import Pincode from "../modules/service_pincode.modules.js";

export const addPincode = async(req, res) =>{
    try {
        const { pincode, status } = req.body;    
        let isPincode = await Pincode.find({pincode});
        let pincodes = new Pincode({ pincode, status })
        if(isPincode.length === 0){
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
        res.status(200).json({
            success: true,
            message: "Pincode fetched successfully",
            data: pincode
        });
    } catch (error) {
        
    }
}

export const deletePincode = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPincode = await Pincode.findByIdAndDelete(id);
        if (!deletedPincode) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found',
                data: null
            });
        }
        res.status(200).json({
            success: true,
            message: 'Pincode deleted successfully',
            data: deletedPincode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete pincode',
            error: error.message
        });
    }
}