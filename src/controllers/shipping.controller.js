import { getShippingRates } from "../services/shipping/shiprocketRate.service.js";


export const shippoWebhookHandler = async (req, res) => {
    try {
        const event = req.body;
        // Process the event as needed
        res.status(200).json({ message: "Webhook received" });
    } catch (error) {
        console.error("Error handling Shippo webhook:", error);
        res.status(500).json({ message: "Internal server error" });
    }  
}

export const postAvailableCouriers = async (req,res) => {
    try {
        const requiestData = req.body;
        const shipmentDetails = {
            pickup_postcode: requiestData.pickup,
            delivery_postcode: requiestData.delivery,
            weight: requiestData.weight,
            cod: requiestData.cod,
            order_value: requiestData.value
        };
        const data = await getShippingRates(shipmentDetails);
        
        return res.status(200).json({success:true, data:data});
    } catch (error) {
        console.error("Error in getAvailableCouriers controller:", error);
        return res.status(500).json({success:false, message:error.message});
    }
};