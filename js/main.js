$(function () {
    function getAccessToken() {
        var access_token_url = window.location.hash.substr(1);

        if (access_token_url == '')
            window.location = 'https://api.put.io/v2/oauth2/authenticate?client_id=1237&response_type=token&redirect_uri=http://putio.obviouslair.com';

        return access_token_url.split('=')[1];
    }

    function Language(data){
        this.name = ko.observable(data.name);
        this.iso = ko.observable(data.iso);
    }

    function File(data) {

        this.id = ko.observable(data.id);
        this.name = ko.observable(data.name);
        this.link_url = ko.observable('https://api.put.io/v2/files/' + data.id + '/download?oauth_token=' + getAccessToken());
        this.opensubtitles_hash = ko.observable(data.opensubtitles_hash);
        this.size = ko.observable(data.size);
        this.created_at = ko.observable(data.created_at);
        this.parent_id = ko.observable(data.parent_id);
		this.is_shared = ko.observable(data.is_shared);

        if (data.content_type == "application/x-directory")
            this.is_dir = ko.observable(1);
        else
            this.is_dir = ko.observable(0);
    }

    function FileListViewModel() {
        var self = this;
        self.files = ko.observableArray();
        self.breadcrumb = ko.observableArray([new File({id: 0, name: 'home'})]);
        self.parent = new File({id: -1});
        self.current = new File({id: 0, name: 'home', content_type: "application/x-directory"});
        self.account_info = [];
        self.query = ko.observable("");
        self.current_iso_language = ko.observable(localStorage['current_iso_language']);
        self.languages = ko.observableArray([new Language({name: 'english', iso:'eng'}), new Language({name: 'french', iso:'fre'})]);
        self.is_loading = ko.observable(true);

        self.access_token = getAccessToken();

        self.filtered_files = ko.computed(function (){
            var search = self.query().trim();

            if (!search)
                return self.files();
            return ko.utils.arrayFilter(self.files(), function (file)
            {
                return (file.name().toLowerCase().indexOf(search) >= 0);
            });
        });

        self.languageChanged = function(event){
            localStorage['current_iso_language'] = event.current_iso_language();
        };

        self.downloadFile = function () {
            window.location = 'https://api.put.io/v2/files/' + this.id() + '/download?oauth_token=' + self.access_token;
        };

        self.downloadSubTitles = function () {
            var current_item = this;

            var name = current_item.name();
            var parts = name.split(".");
            parts.pop();
            name = parts.join('.', parts);

            $.ajax({
                type: "GET",
                url: 'download_subtitle.php',
                data: {name: name, language: self.current_iso_language(), moviehash: current_item.opensubtitles_hash(), moviesize: current_item.size()},
                success: function (data) {
                    if (data)
                        window.location = data;
                    else {
                        $("#no_subtitles_modal").modal('show');
                    }
                }
            });
        };

        self.new_folder_name = ko.observable();
        self.createNewFolder = function () {
            if (self.new_folder_name() != '') {
                $.post('https://api.put.io/v2/files/create-folder', {oauth_token: self.access_token, name: self.new_folder_name(), parent_id: self.current.id()}, function (data) {
                    var file = new File(data.file);
                    self.files.unshift(file);
                    $('#create_folder_modal').modal('hide');
                });
            }
        };

        self.explore = function () {

            var index = self.breadcrumb.indexOf(this);
            if (index >= 0) {
                self.breadcrumb.splice(index + 1, self.breadcrumb().length);
            }
            else {
                self.breadcrumb.push(this);
            }

            self.parent = self.current;
            self.current = this;
            self.files.removeAll();
            $("#loading").modal('show');
            self.is_loading(true);
            $.getJSON('https://api.put.io/v2/files/list', {oauth_token: self.access_token, parent_id: this.id()}, function (data) {
                self.is_loading(false);
                $("#loading").modal('hide');

                var mappedFiles = $.map(data.files, function (item) {
                    return new File(item)
                });
                self.files(mappedFiles);
//                self.files.unshift(self.parent); TODO : parent at top
            });
        };

        self.move_file = new File({id:-1});
        self.save = function (data, context) {
            console.log(data);console.log(context);

            self.move_file = data.$data;
        };

        self.dropped = function (data, context) {
            $.post('https://api.put.io/v2/files/move', {oauth_token: self.access_token, parent_id: context.$data.id(), file_ids:self.move_file.id()}, function(data){
                self.files.remove(self.move_file);
            });
        };

        /*
        init knockout
         */
        $("#loading").modal('show');
        $.getJSON('https://api.put.io/v2/files/list?oauth_token=' + self.access_token, function (data) {
            var mappedFiles = $.map(data.files, function (item) {
                return new File(item)
            });
            $("#loading").modal('hide');
            self.is_loading(false);
            self.files(mappedFiles);
        });

        $.getJSON('https://api.put.io/v2/account/info?oauth_token=' + self.access_token, function (data) {
            self.account_info = data.info;
            if (localStorage.getItem('current_iso_language') === null)
                self.current_iso_language = ko.observable(data.info.default_subtitle_language);
            else
                self.current_iso_language = ko.observable(localStorage['current_iso_language']);
        });

        ko.bindingHandlers.drag = {
            init: function(element, valueAccessor, allBindingsAccessor,
                           viewModel, context) {
                var value = valueAccessor();
                $(element).draggable({
                    containment: 'window',
                    helper: function(evt, ui) {
                        var h = $(element).clone().css({
                            width: $(element).width(),
                            height: $(element).height()
                        });
                        h.data('ko.draggable.data', value(context, evt));
                        return h;
                    },
                    appendTo: 'body'
                });
            }
        };

        ko.bindingHandlers.drop = {
            init: function(element, valueAccessor, allBindingsAccessor,
                           viewModel, context) {
                var value = valueAccessor();
                $(element).droppable({
                    tolerance: 'pointer',
                    hoverClass: 'dragHover',
                    activeClass: 'dragActive',
                    drop: function(evt, ui) {
                        value(ui.helper.data('ko.draggable.data'), context);
                    }
                });
            }
        };
    }

    ko.applyBindings(new FileListViewModel());

    $(".selectpicker").selectpicker();
});