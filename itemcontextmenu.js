define(['apphost', 'globalize', 'connectionManager'], function (appHost, globalize, connectionManager) {

    function getCommands(options) {

        var item = options.item;

        var serverId = item.ServerId;
        var apiClient = connectionManager.getApiClient(serverId);

        return apiClient.getCurrentUser().then(function (user) {

            var commands = [];

            if (item.CanDownload && user.Policy.EnableContentDownloading && appHost.supports('filedownload')) {
                commands.push({
                    name: globalize.translate('sharedcomponents#Download'),
                    id: 'download'
                });
            }

            if (item.Type != 'Timer' && user.Policy.EnablePublicSharing && appHost.supports('sharing')) {
                items.push({
                    name: globalize.translate('Share'),
                    id: 'share'
                });
            }

            return commands;
        });
    }

    function executeCommand(item, id) {

        var itemId = item.Id;
        var serverId = item.ServerId;
        var apiClient = connectionManager.getApiClient(serverId);

        return new Promise(function (resolve, reject) {

            switch (id) {

                case 'download':
                    {
                        require(['fileDownloader'], function (fileDownloader) {
                            var downloadHref = apiClient.getUrl("Items/" + itemId + "/Download", {
                                api_key: apiClient.accessToken()
                            });

                            fileDownloader.download([
                            {
                                url: downloadHref,
                                itemId: itemId,
                                serverId: serverId
                            }]);

                            reject();
                        });

                        break;
                    }
                case 'share':
                    {
                        require(['sharingmanager'], function (sharingManager) {
                            sharingManager.showMenu({
                                serverId: serverId,
                                itemId: itemId

                            }).then(reject);
                        });
                        break;
                    }
                default:
                    break;
            }
        });
    }

    function show(options) {

        return getCommands(options).then(function (commands) {

            return new Promise(function (resolve, reject) {

                require(['actionsheet'], function (actionSheet) {

                    actionSheet.show({
                        items: commands
                    }).then(function (id) {
                        executeCommand(options.item, id).then(resolve);
                    }, reject);
                });
            });

        });
    }

    return {
        getCommands: getCommands,
        show: show
    };
});