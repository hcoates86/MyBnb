const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User, Spot, Review } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Please provide a valid email or username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a password.'),
  handleValidationErrors
];

router.get(
    '/',
    (req, res) => {
      const { user } = req;
      if (user) {
        const safeUser = {
          id: user.id,
          firstName: user.firstName, 
          lastName: user.lastName,
          email: user.email,
          username: user.username,
        };
        return res.json({
          user: safeUser
        });
      } else return res.json({ user: null });
    }
  );

  const passUserCheck = (req, res, next) => {
    const { credential, password } = req.body;
    const errors = [];
    const err = new Error();
    err.message = "Validation error";
    err.status = 400;

    if (!password) {
      errors.push("Password is required")
    } if (!credential) {
      errors.push("Email or username is required")  
    }

    if (!errors.length) return next();
    err.errors = errors;
    return next(err);
  }

  router.post(
    '/',
    passUserCheck,
    validateLogin,
    async (req, res, next) => {
      const { credential, password } = req.body;
  
      const user = await User.unscoped().findOne({
        where: {
          [Op.or]: {
            username: credential,
            email: credential
          }
        }
      });
  
      if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
        // const err = new Error('Login failed');
        // err.status = 401;
        // err.title = 'Login failed';
        // err.errors = { credential: 'The provided credentials were invalid.' };
        const err = new Error();
        err.message = 'Invalid credentials';
        err.status = 401;
        return next(err);
      } 
  
      const safeUser = {
        id: user.id,
        firstName: user.firstName, 
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      };
  
      await setTokenCookie(res, safeUser);
  
      return res.json({
        user: safeUser
      });
    }
  );

  //get current user's spots
router.get('/spots', requireAuth, async (req, res, next) => {

  const myUser = await User.findByPk(req.user.id);
  const spots = await myUser.getSpots({ raw: true});

  const spotsCopy = spots;
  let spotsArray = [];
  
  while (spotsCopy.length) {
    let currSpot = spotsCopy.splice(spotsCopy.length -1)[0];

    let spots2 = await Spot.findByPk(currSpot.id);
    
    const reviewCount = await spots2.countReviews();
    if (!reviewCount) { 
      avgStarRating = 'No reviews yet'
    } else {
      const avg = await Review.sum('stars', { where: { spotId: spots2.id }});
      let avgStarRating = avg / reviewCount;
    }

    let image = await spots2.getSpotImages({ attributes: ['url'], where: { preview: true }})
    if (!image || !image.length) image = 'No preview image';

    const imageRating = {
      "avgRating": avgStarRating,
      "previewImage": image[0].url || image
    }

    Object.assign(currSpot, imageRating);
    spotsArray.unshift(currSpot);
}

res.json({Spots: spotsArray})
})

router.get('/reviews', requireAuth, async (req, res, next) => {
  const myUser = await User.findByPk(req.user.id);
  const reviews = await myUser.getReviews({raw: true})
  let arr = [];

  for (let review of reviews) {
    const spot = await Spot.findByPk(review.spotId);
    let image = await spot.getSpotImages({ attributes: ['url'], where: { preview: true }});
    if (!image || !image.length) image = 'No preview image';
    const currReview = await Review.findByPk(review.id);
    let rImages = await currReview.getReviewImages({attributes: ['id', 'url']});
    if (!rImages || !rImages.length) rImages = 'No review images';
    const spotInfo = await Spot.findByPk(review.spotId, {attributes: {exclude: ['name', 'description', 'createdAt', 'updatedAt']} , raw: true});

    review.User = await User.findByPk(review.userId, {attributes: ['id', 'firstName', 'lastName']});
    
    spotInfo.previewImage = image[0].url || image;
    review.Spot = spotInfo;
    review.ReviewImages = rImages;

    arr.push(review)
  }

  res.json({Reviews: arr})

})

  // Log out
router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
  );



module.exports = router;