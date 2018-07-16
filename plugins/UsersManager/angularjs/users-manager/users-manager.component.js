/*!
 * Piwik - free/libre analytics platform
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

/**
 * Usage:
 * <piwik-users-manager>
 */
(function () {
    angular.module('piwikApp').component('piwikUsersManager', {
        templateUrl: 'plugins/UsersManager/angularjs/users-manager/users-manager.component.html?cb=' + piwik.cacheBuster,
        bindings: {
            currentUserRole: '<',
            initialSiteName: '@',
            initialSiteId: '@',
            accessLevels: '<',
            filterAccessLevels: '<'
        },
        controller: UsersManagerController
    });

    UsersManagerController.$inject = ['$element', 'piwikApi'];

    function UsersManagerController($element, piwikApi) {
        var vm = this;
        vm.isEditing = false;
        vm.isCurrentUserSuperUser = true;

        // search state
        vm.users = [];
        vm.totalEntries = null;
        vm.searchParams = {};
        vm.isLoadingUsers = false;

        vm.$onInit = $onInit;
        vm.$onChanges = $onChanges;
        vm.$onDestroy = $onDestroy;
        vm.onDoneEditing = onDoneEditing;
        vm.showAddExistingUserModal = showAddExistingUserModal;
        vm.onChangeUserRole = onChangeUserRole;
        vm.onDeleteUser = onDeleteUser;
        vm.fetchUsers = fetchUsers;

        function onChangeUserRole(users, role) {
            vm.isLoadingUsers = true;

            var apiPromise;
            if (users !== 'all') {
                apiPromise = piwikApi.post({
                    method: 'UsersManager.setUserAccess',
                    'userLogin[]': users,
                    access: role,
                    idSites: vm.searchParams.idSite
                });
            } else {
                apiPromise = piwikApi.post({
                    method: 'UsersManager.setUserAccessMatching',
                    access: role,
                    filter_search: vm.searchParams.filter_search,
                    filter_access: vm.searchParams.filter_access,
                    idSite: vm.searchParams.idSite
                });
            }

            apiPromise.catch(function () {
                // ignore (errors will still be displayed to the user)
            }).then(function () {
                return fetchUsers();
            });
        }

        function onDeleteUser(users) {
            vm.isLoadingUsers = true;

            var apiPromise;
            if (users !== 'all') {
                apiPromise = piwikApi.post({
                    method: 'UsersManager.deleteUser',
                    'userLogin[]': users
                });
            } else {
                apiPromise = piwikApi.post({
                    method: 'UsersManager.deleteUsersMatching',
                    filter_search: vm.searchParams.filter_search,
                    filter_access: vm.searchParams.filter_access,
                    idSite: vm.searchParams.idSite
                });
            }

            apiPromise.catch(function () {
                // ignore (errors will still be displayed to the user)
            }).then(function () {
                return fetchUsers();
            });
        }

        function $onInit() {
            // TODO: maybe this should go in another directive...
            $element.tooltip({
                track: true,
                content: function() {
                    var title = $(this).attr('title');
                    return piwikHelper.escape(title.replace(/\n/g, '<br />'));
                },
                show: false,
                hide: false
            });

            if (vm.currentUserRole === 'superuser') {
                vm.filterAccessLevels.push({ key: 'superuser', value: 'Superuser' });
            }

            vm.searchParams = {
                offset: 0,
                limit: 20,
                filter_search: '',
                filter_access: '',
                idSite: vm.initialSiteId
            };

            fetchUsers();
        }

        function $onChanges(changes) {
            if (changes.limit) {
                fetchUsers();
            }
        }

        function $onDestroy() {
            try {
                $element.tooltip('destroy');
            } catch (e) {
                // empty
            }
        }

        function fetchUsers() {
            vm.isLoadingUsers = true;
            return piwikApi.fetch($.extend({}, vm.searchParams, {
                method: 'UsersManager.getUsersPlusRole',
            })).then(function (response) {
                vm.totalEntries = response.total;
                vm.users = response.results;

                vm.isLoadingUsers = false;
            }).catch(function () {
                vm.isLoadingUsers = false;
            });
        }

        function onDoneEditing(isUserModified) {
            vm.isEditing = false;
            if (isUserModified) { // if a user was modified, we must reload the users list
                fetchUsers();
            }
        }

        function showAddExistingUserModal() {
            $element.find('.add-existing-user-modal').openModal({ dismissible: false });
        }
    }
})();
