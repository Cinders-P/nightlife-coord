const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
	zid: Number,
	count: { type: Number, default: 0 },
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
