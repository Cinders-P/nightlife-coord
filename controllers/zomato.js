const keys = require('../lib/keys');
const User = require('../models/user');
const request = require('request');
const Restaurant = require('../models/restaurant');

module.exports = {
	getCity: (city, response, req, loggedIn) => {
		let sent = false;
		const options = {
			method: 'GET',
			url: `https://developers.zomato.com/api/v2.1/cities?q=${city}&count=1`,
			headers: {
				'user-key': keys.zomato,
				'content-type': 'application/json',
			},
		};
		request(options, (errorCity, resCity, bodyCity) => {
			if (!errorCity && JSON.parse(bodyCity)
				.location_suggestions[0]) {
				const newCity = JSON.parse(bodyCity)
					.location_suggestions[0].name;
				options.url = 'https://developers.zomato.com/api/v2.1/search?entity_id=' + JSON.parse(bodyCity)
					.location_suggestions[0].id + '&entity_type=city&establishment_type=bars' +
					'&category=3&count=20';
				request(options, (error, res, body) => {
					if (!error && res.statusCode === 200) {
						const jBody = JSON.parse(body);
						const idArr = [];
						const nameArr = [];
						const urlArr = [];
						const photoArr = [];
						const addressArr = [];
						const cuisineArr = [];
						const priceArr = [];
						const ratingArr = [];
						const glowArr = [];
						jBody.restaurants.forEach((place) => {
							nameArr.push(place.restaurant.name);
							urlArr.push(place.restaurant.url);
							addressArr.push(place.restaurant.location.address);
							cuisineArr.push(place.restaurant.cuisines);
							priceArr.push(place.restaurant.price_range);
							ratingArr.push(place.restaurant.user_rating.aggregate_rating);
							photoArr.push(place.restaurant.thumb);
							idArr.push(place.restaurant.id);
						});
						if (!sent) {
							const promises = [];
							const goingArr = [];
							console.log('starting promises');

							for (let i = 0; i < idArr.length; i++) {
								promises.push(new Promise((resolve, reject) => {
									Restaurant.findOne({ zid: idArr[i] }, (err, rest) => {
										if (err) console.error(err);
										(rest) ? goingArr.push(rest.count) : goingArr.push(0);
										if (rest) {
											if (loggedIn) {
												User.findOne({ 'local.username': req.user.local.username }, (err, guy) => {
													for (let x = 0; x < guy.local.places.length; x++) {
														if (guy.local.places[x] == idArr[i]) {
															glowArr[i] = 1;
														}
														resolve();
													}
												});
											} else if (req.session.places && req.session.places.includes(idArr[i])) {
												glowArr[i] = 1;
												resolve();
											} else {
												resolve();
											}
											goingArr[i] = rest.count;
										} else {
											glowArr[i] = 0;
											goingArr[i] = 0;
											resolve();
										}
									});
								}));
							}
							Promise.all(promises).then(() => {
								console.log('promises resolved');
								if (loggedIn) {
									User.findOneAndUpdate({ 'local.username': req.user.local.username }, {
										$set: { 'local.lastSearch': city },
									}, (err, doc) => {});
								} else {
									req.session.lastSearch = city;
								}
								console.log('Assigned last search: ' + city);
								sent = true;
								response.render('search', {
									goingArr,
									nameArr,
									urlArr,
									addressArr,
									cuisineArr,
									priceArr,
									ratingArr,
									photoArr,
									idArr,
									newCity,
									glowArr,
									loggedIn,
								});
							});
						}
					}
				});
			} else {
				if (!sent) {
					sent = true;
					response.render('search', {
						newCity: false,
						loggedIn,
					});
				}
			}
		});
		setTimeout(() => { // In case something goes wrong above, still send a response back to the user
			if (!sent) {
				sent = true;
				response.render('search', {
					newCity: false,
					loggedIn,
				});
			}
		}, 7000);
	},
};
