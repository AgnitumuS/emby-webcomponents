define(['connectionManager', 'paper-icon-button-light', 'material-icons', 'emby-button'], function (connectionManager) {

    function getUserDataButtonHtml(method, itemId, iconCssClass, icon, tooltip, style) {

        var is = style == 'fab' ? 'emby-button' : 'paper-icon-button-light';
        var className = style == 'fab' ? 'autoSize fab' : 'autoSize';

        className += ' ' + iconCssClass;

        return '<button title="' + tooltip + '" data-itemid="' + itemId + '" is="' + is + '" class="' + className + '" onclick="UserDataButtons.' + method + '(this);return false;">\
                <i class="md-icon">' + icon + '</i>\
            </button>';
    }

    function fill(options) {

        var html = getIconsHtml(options.item, options.includePlayed, options.buttonClass, options.style);

        options.element.innerHTML = html;
    }

    function getIconsHtml(item, includePlayed, cssClass, style) {

        var html = '';

        var userData = item.UserData || {};

        var itemId = item.Id;

        var btnCssClass = "btnUserData";

        if (cssClass) {
            btnCssClass += " " + cssClass;
        }

        if (includePlayed !== false) {
            var tooltipPlayed = Globalize.translate('core#TooltipPlayed');

            if (item.MediaType == 'Video' || item.Type == 'Series' || item.Type == 'Season' || item.Type == 'BoxSet' || item.Type == 'Playlist') {
                if (item.Type != 'TvChannel') {
                    if (userData.Played) {
                        html += getUserDataButtonHtml('markPlayed', itemId, btnCssClass + ' btnUserDataOn', 'check', tooltipPlayed, style);
                    } else {
                        html += getUserDataButtonHtml('markPlayed', itemId, btnCssClass, 'check', tooltipPlayed, style);
                    }
                }
            }
        }

        var tooltipLike = Globalize.translate('core#TooltipLike');
        var tooltipDislike = Globalize.translate('core#TooltipDislike');

        //if (typeof userData.Likes == "undefined") {
        //    html += getUserDataButtonHtml('markDislike', itemId, btnCssClass + ' btnUserData btnDislike', 'thumb-down', tooltipDislike);
        //    html += getUserDataButtonHtml('markLike', itemId, btnCssClass + ' btnUserData btnLike', 'thumb-up', tooltipLike);
        //}
        //else if (userData.Likes) {
        //    html += getUserDataButtonHtml('markDislike', itemId, btnCssClass + ' btnUserData btnDislike', 'thumb-down', tooltipDislike);
        //    html += getUserDataButtonHtml('markLike', itemId, btnCssClass + ' btnUserData btnLike btnUserDataOn', 'thumb-up', tooltipLike);
        //}
        //else {
        //    html += getUserDataButtonHtml('markDislike', itemId, btnCssClass + ' btnUserData btnDislike btnUserDataOn', 'thumb-down', tooltipDislike);
        //    html += getUserDataButtonHtml('markLike', itemId, btnCssClass + ' btnUserData btnLike', 'thumb-up', tooltipLike);
        //}

        var tooltipFavorite = Globalize.translate('core#TooltipFavorite');
        if (userData.IsFavorite) {

            html += getUserDataButtonHtml('markFavorite', itemId, btnCssClass + ' btnUserData btnUserDataOn', 'favorite', tooltipFavorite, style);
        } else {
            html += getUserDataButtonHtml('markFavorite', itemId, btnCssClass + ' btnUserData', 'favorite', tooltipFavorite, style);
        }

        return html;
    }

    function markFavorite(link) {

        var id = link.getAttribute('data-itemid');

        var markAsFavorite = !link.classList.contains('btnUserDataOn');

        favorite(id, markAsFavorite);

        if (markAsFavorite) {
            link.classList.add('btnUserDataOn');
        } else {
            link.classList.remove('btnUserDataOn');
        }
    }

    function markLike(link) {

        var id = link.getAttribute('data-itemid');

        if (!link.classList.contains('btnUserDataOn')) {

            likes(id, true);

            link.classList.add('btnUserDataOn');

        } else {

            clearLike(id);

            link.classList.remove('btnUserDataOn');
        }

        link.parentNode.querySelector('.btnDislike').classList.remove('btnUserDataOn');
    }

    function markDislike(link) {

        var id = link.getAttribute('data-itemid');

        if (!link.classList.contains('btnUserDataOn')) {

            likes(id, false);

            link.classList.add('btnUserDataOn');

        } else {

            clearLike(id);

            link.classList.remove('btnUserDataOn');
        }

        link.parentNode.querySelector('.btnLike').classList.remove('btnUserDataOn');
    }

    function markPlayed(link) {

        var id = link.getAttribute('data-itemid');

        if (!link.classList.contains('btnUserDataOn')) {

            played(id, true);

            link.classList.add('btnUserDataOn');

        } else {

            played(id, false);

            link.classList.remove('btnUserDataOn');
        }
    }

    function likes(id, isLiked) {
        var apiClient = connectionManager.currentApiClient();
        return apiClient.updateUserItemRating(apiClient.getCurrentUserId(), id, isLiked);
    }

    function played(id, isPlayed) {
        var apiClient = connectionManager.currentApiClient();

        var method = isPlayed ? 'markPlayed' : 'markUnplayed';

        return apiClient[method](apiClient.getCurrentUserId(), id, new Date());
    }

    function favorite(id, isFavorite) {
        var apiClient = connectionManager.currentApiClient();

        return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), id, isFavorite);
    }

    function clearLike(id) {

        var apiClient = connectionManager.currentApiClient();

        return apiClient.clearUserItemRating(apiClient.getCurrentUserId(), id);
    }

    window.UserDataButtons = {
        markPlayed: markPlayed,
        markDislike: markDislike,
        markLike: markLike,
        markFavorite: markFavorite
    };

    return {
        fill: fill,
        getIconsHtml: getIconsHtml
    };

});