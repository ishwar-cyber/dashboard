import router from 'express';
import { createCoupon, deleteCoupon, getCouponById, getCouponByCode, getCoupons } from '../controllers/coupon.controllers.js';        
import { authenticate, roleBase } from '../middleware/auth.middlerwares.js';


const couponRouter = router.Router();

couponRouter.post('/', authenticate, roleBase('admin'), createCoupon);
couponRouter.get('/', authenticate, getCoupons);
couponRouter.put('/:id', authenticate, roleBase('admin'), createCoupon);
couponRouter.delete('/:id', authenticate, roleBase('admin'), deleteCoupon);
couponRouter.get('/search/:code', getCoupons);
couponRouter.get('/:code', getCouponByCode);

export default couponRouter;
