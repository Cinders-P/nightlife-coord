$(() => {
	$('.button:contains("Going")').click((e) => {
		$.post('/going', { zid: $(e.target).attr('name') }, () => {
			if ($(e.target).hasClass('glow')) {
				$(e.target).removeClass('glow');
				const num = $(e.target).text().match(/[0-9]/g).join('');
				$(e.target).text((+num - 1) + ' Going');
			} else {
				$(e.target).addClass('glow');
				const num = $(e.target).text().match(/[0-9]/g).join('');
				$(e.target).text((+num + 1) + ' Going');
			}
		});
	});
});
