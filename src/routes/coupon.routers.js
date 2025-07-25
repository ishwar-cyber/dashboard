import router from 'express';
import { createCoupon, deleteCoupon, getCouponById, getCouponByCode, getCoupons } from '../controllers/coupon.controllers.js';        
import { tokenVerify, role } from '../middleware/auth.middlerwares.js';


const couponRouter = router.Router();

couponRouter.post('/', tokenVerify, role('admin'), createCoupon);
couponRouter.get('/', tokenVerify, getCoupons);
couponRouter.put('/:id', tokenVerify, role('admin'), createCoupon);
couponRouter.delete('/:id', tokenVerify, role('admin'), deleteCoupon);
couponRouter.get('/search/:code', tokenVerify, getCoupons);
couponRouter.get('/:code', tokenVerify, getCouponByCode);

export default couponRouter;
