// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia & The Oddball
// @description Adds coloring to history pages indicating recent sales and direct link to user's outpost page
// @include     /https?:\/\/backpack\.tf\/item\/.*/
// @version     3.0
// @grant       none
// @run-at      document-end
// @updateURL   https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.meta.js
// @downloadURL https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.user.js
// ==/UserScript==


(function(){
    var hosts = {
        'tf2outpost': 'www.tf2outpost.com',
        'backpack': 'backpack.tf'
    };
    var colsHeads = {
        'owner': 'User',
        'lastseen': 'Last seen',
        'id': 'ID'
    };
    var cols = {};
    var $historytable = $('.history-sheet table.table');
    var collection = {};
    var prevsteamid;
    var currentowner = true;
    var itemname;
    var dupeditem;
    
    outpostHistoryReady = function() {
        var $tr = $historytable.find('tbody tr'),
            $headertr = $historytable.find('thead tr th'),
            $tds, usersteamid, itemid;
        
        dupeditem = $('#dupe-modal-btn').length > 0;
        itemname = $('.item').attr('data-name'); // assign item name
        
        $headertr.each(getColPos); // get position of each column
        $tr.each(getID); // iterate to collect id's
        $tr.each(historyLink); // iterate to add links
    };
    
    getColPos = function() {
        for (var k in colsHeads) {
            if (colsHeads[k].toLowerCase() === $(this).text().toLowerCase()) {
                cols[k] = $(this).index();
            }
        }
    };
    
    // fill collection with id's for each steamid
    getID = function() {
        var $this = $(this);
        var $tds = $this.find('td');
        var itemid = $tds.eq(cols['id']).text().trim();
        var usersteamid = $tds.eq(cols['owner']).find('.user-handle a').attr('data-id');
        
        if (itemid && usersteamid) {
            (collection[usersteamid] = collection[usersteamid] || []).push(itemid); // push id
        }
    };
    
    historyLink = function() {
        var $row = $(this);
        var columns = getColumns($row);
        var itemid = columns['id'].text().trim();
        var lastseendate = new Date(columns['lastseen'].text());
        var usersteamid = columns['owner'].find('.user-handle a').attr('data-id');
        var days = dayDifference(lastseendate, new Date());
        
        if (prevsteamid && currentowner && usersteamid != prevsteamid) {
            currentowner = false; // used to detect current owner - will remain falsy after original owner has passed
        }
        
        function addLink(href, contents) {
                var $link = $('<a/>')
                    .html(contents)
                    .attr({
                        'href': href,
                        'target': '_blank'
                    });
                var $span = $('<span/>')
                    .css({
                        'float': 'right',
                        'margin-left': '0.6em'
                    })
                    .append($link);
                
                columns['owner'].append($span);
        };
        
        addLink(outpostTradeURL(usersteamid, collection[usersteamid]), '<i class="stm stm-tf2outpost"></i>');
        
        if (
            Session && Session.steamid &&
            // do not show if current owner, unless there is no item name (moved to elsewhere)
            // logged in user and steamid of row must match
            ((!currentowner || !itemname) && Session.steamid == usersteamid) ||
            // if previous row steamid is different than logged in user
            (Session.steamid == prevsteamid) ||
            // duped items will have links on each row
            (dupeditem && collection[Session.steamid])
        ) {
            addLink(inventoryHistoryURL(Session.steamid, lastseendate), '<i class="stm stm-steam"></i>');
        }
        
        if (days <= 60) {
            $row.addClass('success');
        } else if (days <= 120) {
            $row.addClass('warning');
        }
        
        prevsteamid = usersteamid;
    };
    
    getColumns = function($row) {
        var $tds = $row.find('td');
        var columns = {};
        
        for (var k in cols) {
            columns[k] = $tds.eq(cols[k]);
        }
        
        return columns;
    };
    
    outpostURL = function(itemid) {
        return 'http://' + [
            hosts.tf2outpost,
            'item',
            '440,' + itemid
        ].join('/');
    };
    
    outpostTradeURL = function(steamid, ids) {
        return 'http://' + [
            hosts.tf2outpost,
            'user',
            steamid
        ].join('/') + '?itemid=' + ids.join(',');
    };
    
    dayDifference = function(d1, d2) {
        return Math.round(Math.abs((d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000)))
    };
    
    inventoryHistoryURL = function(steamid, date) {
        return [
            'http://steamcommunity.com/profiles/',
            steamid,
            '/inventoryhistory/?after_time=',
            (date.getTime() / 1000),
            '&prev=1',
            ((itemname && '#filter-' + itemname) || '') // for adding a filter with history bastard - https://naknak.net/tf2/historybastard/historybastard.user.js
        ].join('');
    };
    
    itemURL = function(id) {
        return window.location.protocol + '//' + window.location.hostname + '/item/' + id;
    };
    
    outpostHistoryReady();
})();
