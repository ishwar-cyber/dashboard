import router from 'express';
import { createCoupon, deleteCoupon, getCoupons } from '../controllers/coupon.controllers.js';        
import { authorize, roleBase } from '../middleware/auth.middlerwares.js';


const couponRouter = router.Router();

couponRouter.post('/', authorize, roleBase('admin'), createCoupon);
couponRouter.get('/', getCoupons);
couponRouter.get('/:id', getCoupons);
couponRouter.put('/:id', authorize, roleBase('admin'), createCoupon);
couponRouter.delete('/:id', authorize, roleBase('admin'), deleteCoupon);
couponRouter.get('/search/:code', getCoupons);
couponRouter.get('/code/:code', getCoupons);

// couponRouter.get('/discount/:discount', getCoupon);
// couponRouter.get('/expiry/:expiryDate', getCoupon);
// couponRouter.get('/active', getCoupon);
// couponRouter.get('/inactive', getCoupon);
// couponRouter.get('/expired', getCoupon);


export default couponRouter;
