import axios from "axios";
import { SHIPROCKET_BASE_URL } from "../../../config/env.js";
import { getShiprocketAuthToken } from "./shiproketAuth.service.js";

export const getShippingRates = async (shipmentDetails) => {
  try {
    const token = await getShiprocketAuthToken();

    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/serviceability`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: shipmentDetails,
      }
    );
    if(!response.data?.data?.available_courier_companies){
      throw new Error(response.data);
    }
    const couriers =
      response.data?.data?.available_courier_companies ?? [];
    console.log('couriers', couriers);
    
    if (!couriers.length) {
      return  response.data;
    } 

    // ✅ lowest cost courier
    return couriers.sort((a, b) => a.rate - b.rate)[0];

  } catch (error) {
    // 🔥 HTTP errors (400, 404, 500)
    if (error.response) {
      const { status, data } = error.response;

      console.error("Shiprocket API Error:", status, data);

      switch (status) {
        case 400:
          throw new Error(data?.message || "Invalid shipment details");
        case 401:
          throw new Error("Shiprocket authentication failed");
        case 404:
          throw new Error("Courier service not available for this pincode");
        case 500:
          throw new Error("Shiprocket server error, try later");
        default:
          throw new Error("Unexpected Shiprocket error");
      }
    }

    // 🔥 Network / timeout errors
    if (error.request) {
      throw new Error("Shiprocket service unreachable");
    }

    // 🔥 Code errors
    throw new Error(error.message);
  }
};
