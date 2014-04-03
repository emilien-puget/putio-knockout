$(function ()
{
	function getAccessToken()
	{
		var access_token_url = window.location.hash.substr(1);

		if (access_token_url == '')
			window.location = 'https://api.put.io/v2/oauth2/authenticate?client_id=1237&response_type=token&redirect_uri=http://emilkies.free.fr/putio/';

		return access_token_url.split('=')[1];
	}

	function File(data)
	{

		this.id = ko.observable(data.id);
		this.name = ko.observable(data.name);
		this.link_url = ko.observable(data.link_url);
		this.opensubtitles_hash = ko.observable(data.opensubtitles_hash);
		this.size = ko.observable(data.size);
		this.created_at = ko.observable(data.created_at);
		this.parent_id = ko.observable(data.parent_id);

		if (data.content_type == "application/x-directory")
			this.is_dir = ko.observable(1);
		else
			this.is_dir = ko.observable(0);
	}

	function FileListViewModel()
	{
		var self = this;
		self.files = ko.observableArray();
		self.breadcrumb = ko.observableArray([new File({id: 0, name: 'home'})]);
		self.parent = new File({id: -1});
		self.current = new File({id: 0, name: 'home'});
		self.account_info = [];

		self.access_token = getAccessToken();

		self.downloadFile = function ()
		{
			window.location = 'https://api.put.io/v2/files/' + this.id() + '/download?oauth_token=' + self.access_token;
		};

		self.downloadSubTitles = function ()
		{

			var current_item = this;
			var url = 'https://api.put.io/v2/files/' + current_item.id() + '/subtitles/default?oauth_token=' + self.access_token;


			$.fileDownload(url, {
				failCallback: function (html, url)
				{
					$.xmlrpc({
						url: 'http://api.opensubtitles.org/xml-rpc',
						methodName: 'SearchSubtitles',
						params: [
							self.account_info.token,
							{'sublanguageid': self.account_info.default_subtitle_language, 'moviehash': current_item.opensubtitles_hash(), 'moviebytesize': current_item.size()}
						],
						success: function (response, status, jqXHR)
						{
							console.log(response);
						},
						error: function (jqXHR, status, error)
						{
							console.error('shit happened');
						}
					});


					console.log('no subtitle');
				}
			});
		};


		self.explore = function ()
		{

			var index = self.breadcrumb.indexOf(this);
			if (index >= 0)
			{
				self.breadcrumb.splice(index + 1, self.breadcrumb().length);
			}
			else
			{
				self.breadcrumb.push(this);
			}

			self.files.removeAll();
			$.getJSON('https://api.put.io/v2/files/list', {oauth_token: self.access_token, parent_id: this.id()}, function (data)
			{
				var mappedFiles = $.map(data.files, function (item)
				{
					return new File(item)
				});
				self.files(mappedFiles);
			});
		};

		$.getJSON('https://api.put.io/v2/files/list?oauth_token=' + self.access_token, function (data)
		{
			var mappedFiles = $.map(data.files, function (item)
			{
				return new File(item)
			});
			self.files(mappedFiles);
		});


		$.getJSON('https://api.put.io/v2/account/info?oauth_token=' + self.access_token, function (data)
		{
			self.account_info = data.info;
			$.xmlrpc({
				url: 'http://api.opensubtitles.org/xml-rpc',
				methodName: 'LogIn',
				async: false,
				params: ['', '', self.account_info.default_subtitle_language, 'OS Test User Agent'],
				success: function (response)
				{
					self.account_info.token = response[0].token;
				},
				error: function (jqXHR, status, error)
				{
					console.error('shit happened');
				}
			});


		});
	}

	ko.applyBindings(new FileListViewModel());
});