const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const total = await User.countDocuments();
    const withoutSlug = await User.countDocuments({ slug: { $exists: false } });
    const nullSlug = await User.countDocuments({ slug: null });
    const emptySlug = await User.countDocuments({ slug: "" });
    console.log('Total users:', total);
    console.log('Without slug field:', withoutSlug);
    console.log('Slug is null:', nullSlug);
    console.log('Slug is empty string:', emptySlug);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
