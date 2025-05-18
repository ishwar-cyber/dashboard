import router from 'express';
import { createCoupon, deleteCoupon, getCouponById, getCouponByCode, getCoupons } from '../controllers/coupon.controllers.js';        
import { authorize, roleBase } from '../middleware/auth.middlerwares.js';


const couponRouter = router.Router();

couponRouter.post('/', authorize, roleBase('admin'), createCoupon);
couponRouter.get('/', getCoupons);
couponRouter.put('/:id', authorize, roleBase('admin'), createCoupon);
couponRouter.delete('/:id', authorize, roleBase('admin'), deleteCoupon);
couponRouter.get('/search/:code', getCoupons);
couponRouter.get('/:code', getCouponByCode);

export default couponRouter;
