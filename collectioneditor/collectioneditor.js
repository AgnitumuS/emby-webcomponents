﻿define(['shell', 'dialogHelper', 'loading', 'layoutManager', 'connectionManager', 'scrollHelper', 'embyRouter', 'globalize', 'paper-checkbox', 'paper-input', 'paper-icon-button-light', 'emby-select', 'html!./../icons/nav.html', 'css!./../formdialog'], function (shell, dialogHelper, loading, layoutManager, connectionManager, scrollHelper, embyRouter, globalize) {

    var currentServerId;

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function onSubmit(e) {
        loading.show();

        var panel = parentWithClass(this, 'dialog');

        var collectionId = panel.querySelector('#selectCollectionToAddTo').value;

        var apiClient = connectionManager.getApiClient(currentServerId);

        if (collectionId) {
            addToCollection(apiClient, panel, collectionId);
        } else {
            createCollection(apiClient, panel);
        }

        e.preventDefault();
        return false;
    }

    function createCollection(apiClient, dlg) {

        var url = apiClient.getUrl("Collections", {

            Name: dlg.querySelector('#txtNewCollectionName').value,
            IsLocked: !dlg.querySelector('#chkEnableInternetMetadata').checked,
            Ids: dlg.querySelector('.fldSelectedItemIds').value || ''

            //ParentId: getParameterByName('parentId') || LibraryMenu.getTopParentId()

        });

        apiClient.ajax({
            type: "POST",
            url: url,
            dataType: "json"

        }).then(function (result) {

            loading.hide();

            var id = result.Id;

            dialogHelper.close(dlg);
            redirectToCollection(apiClient, id);

        });
    }

    function redirectToCollection(apiClient, id) {

        apiClient.getItem(apiClient.getCurrentUserId(), id).then(function (item) {

            embyRouter.showItem(item);
        });
    }

    function addToCollection(apiClient, dlg, id) {

        var url = apiClient.getUrl("Collections/" + id + "/Items", {

            Ids: dlg.querySelector('.fldSelectedItemIds').value || ''
        });

        apiClient.ajax({
            type: "POST",
            url: url

        }).then(function () {

            loading.hide();

            dialogHelper.close(dlg);

            require(['toast'], function (toast) {
                toast(globalize.translate('sharedcomponents#MessageItemsAdded'));
            });
        });
    }

    function triggerChange(select) {
        select.dispatchEvent(new CustomEvent('change', {}));
    }

    function populateCollections(panel) {

        loading.show();

        var select = panel.querySelector('#selectCollectionToAddTo');

        panel.querySelector('.newCollectionInfo').classList.add('hide');

        var options = {

            Recursive: true,
            IncludeItemTypes: "BoxSet",
            SortBy: "SortName"
        };

        var apiClient = connectionManager.getApiClient(currentServerId);
        apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var html = '';

            html += '<option value="">' + globalize.translate('sharedcomponents#NewCollection') + '</option>';

            html += result.Items.map(function (i) {

                return '<option value="' + i.Id + '">' + i.Name + '</option>';
            });

            select.innerHTML = html;
            select.value = '';
            triggerChange(select);

            loading.hide();
        });
    }

    function getEditorHtml() {

        var html = '';

        html += '<div class="dialogContent smoothScrollY">';
        html += '<div class="dialogContentInner centeredContent">';
        html += '<form class="newCollectionForm" style="margin:auto;">';

        html += '<div>';
        html += globalize.translate('sharedcomponents#NewCollectionHelp');
        html += '</div>';

        html += '<div class="fldSelectCollection">';
        html += '<br/>';
        html += '<br/>';
        html += '<select is="emby-select" label="' + globalize.translate('sharedcomponents#LabelCollection') + '" id="selectCollectionToAddTo" autofocus></select>';
        html += '</div>';

        html += '<div class="newCollectionInfo">';

        html += '<div>';
        html += '<paper-input type="text" id="txtNewCollectionName" required="required" label="' + globalize.translate('sharedcomponents#LabelName') + '"></paper-input>';
        html += '<div class="fieldDescription">' + globalize.translate('sharedcomponents#NewCollectionNameExample') + '</div>';
        html += '</div>';

        html += '<br />';

        html += '<div>';
        html += '<paper-checkbox id="chkEnableInternetMetadata">' + globalize.translate('sharedcomponents#SearchForCollectionInternetMetadata') + '</paper-checkbox>';
        html += '</div>';

        // newCollectionInfo
        html += '</div>';

        html += '<br />';
        html += '<br />';
        html += '<div>';
        html += '<paper-button raised class="btnSubmit block">' + globalize.translate('sharedcomponents#ButtonOk') + '</paper-button>';
        html += '</div>';

        html += '<input type="hidden" class="fldSelectedItemIds" />';

        html += '</form>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    function onHelpClick(e) {

        shell.openUrl(this.href);
        e.preventDefault();
        return false;
    }

    function initEditor(content, items) {

        content.querySelector('#selectCollectionToAddTo').addEventListener('change', function () {
            if (this.value) {
                content.querySelector('.newCollectionInfo').classList.add('hide');
                content.querySelector('#txtNewCollectionName').removeAttribute('required');
            } else {
                content.querySelector('.newCollectionInfo').classList.remove('hide');
                content.querySelector('#txtNewCollectionName').setAttribute('required', 'required');
            }
        });

        content.querySelector('.btnSubmit').addEventListener('click', function () {
            // Do a fake form submit this the button isn't a real submit button
            var fakeSubmit = document.createElement('input');
            fakeSubmit.setAttribute('type', 'submit');
            fakeSubmit.style.display = 'none';
            var form = content.querySelector('form');
            form.appendChild(fakeSubmit);
            fakeSubmit.click();

            // Seeing issues in smart tv browsers where the form does not get submitted if the button is removed prior to the submission actually happening
            setTimeout(function () {
                form.removeChild(fakeSubmit);
            }, 500);
        });

        content.querySelector('form').addEventListener('submit', onSubmit);

        content.querySelector('.fldSelectedItemIds', content).value = items.join(',');

        if (items.length) {
            content.querySelector('.fldSelectCollection').classList.remove('hide');
            populateCollections(content);
        } else {
            content.querySelector('.fldSelectCollection').classList.add('hide');

            var selectCollectionToAddTo = content.querySelector('#selectCollectionToAddTo');
            selectCollectionToAddTo.innerHTML = '';
            selectCollectionToAddTo.value = '';
            triggerChange(selectCollectionToAddTo);
        }
    }

    function collectioneditor() {

        var self = this;

        self.show = function (options) {

            var items = options.items || {};
            currentServerId = options.serverId;

            var dialogOptions = {
                removeOnClose: true,
                scrollY: false
            };

            if (layoutManager.tv) {
                dialogOptions.size = 'fullscreen';
            } else {
                dialogOptions.size = 'small';
            }

            var dlg = dialogHelper.createDialog(dialogOptions);

            dlg.classList.add('formDialog');

            var html = '';
            var title = items.length ? globalize.translate('sharedcomponents#AddToCollection') : globalize.translate('sharedcomponents#NewCollection');

            html += '<div class="dialogHeader" style="margin:0 0 2em;">';
            html += '<button is="paper-icon-button-light" class="btnCancel" tabindex="-1"><iron-icon icon="nav:arrow-back"></iron-icon></button>';
            html += '<div class="dialogHeaderTitle">';
            html += title;
            html += '</div>';

            html += '<a class="btnHelp" href="https://github.com/MediaBrowser/Wiki/wiki/Collections" target="_blank" style="margin-left:auto;margin-right:.5em;display:inline-block;padding:.25em;display:flex;align-items:center;" title="' + globalize.translate('sharedcomponents#Help') + '"><iron-icon icon="nav:info"></iron-icon><span style="margin-left:.25em;">' + globalize.translate('sharedcomponents#Help') + '</span></a>';

            html += '</div>';

            html += getEditorHtml();

            dlg.innerHTML = html;
            document.body.appendChild(dlg);

            initEditor(dlg, items);

            dlg.querySelector('.btnCancel').addEventListener('click', function () {

                dialogHelper.close(dlg);
            });

            if (layoutManager.tv) {
                scrollHelper.centerFocus.on(dlg.querySelector('.dialogContent'), false);
            }

            return new Promise(function (resolve, reject) {

                dlg.addEventListener('close', resolve);
                dialogHelper.open(dlg);
            });
        };
    }

    return collectioneditor;
});