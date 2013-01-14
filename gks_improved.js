// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
var debug = false;
var _dbg = function (section, str) {
	if(debug) {
		var dd = new Date();
		var debugPrepend = "[" + dd.getHours() + ":" + dd.getMinutes() + ":" + dd.getSeconds() + ":" + dd.getMilliseconds() + "] [" + section + "] ";
		if(typeof str == "object") {
			console.log(debugPrepend);
			console.log(str);
		}
		else {
			console.log(debugPrepend + str);
		}
	}
};

var dbg = function(str) {
	_dbg("Main", str);
}

dbg("[Init] Loading general funcs");

////////////////////////////////////
// parseUrl(url)
// Returns an array with splited url
////////////////////////////////////
var parseUrl = function (url) {
	var host = url.match("^https:\\/\\/gks.gs");
	if(!host) {
		return false;
	}
	var parsedUrl = {};
	parsedUrl.host = host;
	url = url.replace(parsedUrl.host, "");

	var path = url.match("/[a-z\./]*/?");
	parsedUrl.path = path;
	url = url.replace(parsedUrl.path, "");

	if(url.indexOf("?") == -1 && url.indexOf("&") == -1) {
		return parsedUrl;
	}

	url = url.replace("?", "");

	var hash = url.match("#.*$");
	if(hash) {
		url = url.replace(hash, "");
		parsedUrl.hash = hash;
	}

	var urlSplit = url.split('&');
	if(!urlSplit.length) {
		return false;
	}

	parsedUrl.params = {};
	$.each(urlSplit, function (k, v) {
		if(v == "") {
			return;
		}
		var params = v.split('=');
		parsedUrl.params[params[0]] = params[1];
	});
	return parsedUrl;
};

//////////////////////////////////////////////////////
// craftUrl(parsedUrl)
// Returns a complete url by concat data from parseUrl
//////////////////////////////////////////////////////
var craftUrl = function (parsedUrl) {
	if(!parsedUrl.params) {
		return parsedUrl.host + parsedUrl.path;
	}

	var craftUrl = parsedUrl.host + parsedUrl.path + (parsedUrl.cancelQ ? "&" : '?');
	var i = 0;
	$.each(parsedUrl.params, function (k, v) {
		craftUrl += (i == 0 ? '' : '&') + k + (v ? "=" + v : '');
		i++;
	});
	craftUrl += (parsedUrl.hash ? parsedUrl.hash : '');

	return craftUrl;
};

///////////////////////////////////
// grabPage(url, callback)
// Calls callback after ajax on url
///////////////////////////////////
var grabPage = function(url, callback) {
	var nextUrl = craftUrl(url);
	$.ajax({
		type: 'GET',
		url: nextUrl,
		success: function(data) {
			callback(data);
		}
	});
};

// Storage functions
var storage = {
	set: function(module, opts) {
		var tempStore = {};
		$.each(opts, function(o, v) {
			tempStore[o] = v.val;
		});
		localStorage.setItem(module, JSON.stringify(tempStore));
	},
	get: function(module) {
		return JSON.parse(localStorage.getItem(module));
	}
}

// Options
var opt = {
	options: {
		torrent_list: {
			endless_scrolling: { defaultVal: false },
			filtering_fl: { defaultVal: false }
		},
		snatched: {
			endless_scrolling: { defaultVal: false },
			filtering_deleted: { defaultVal: true }
		},
		forums: {
			twit_auto_complete: { defaultVal: true },
			twit_color: { defaultVal: true } 
		}
	},
	get: function(m, o) {
		return this.options[m][o].val;
	},
	set: function(m, o, v) {
		this.options[m][o].val = v;
		storage.set(m, this.options[m]);
	},
	load: function() {
		$.each(this.options, function(m, opts) {
			values = storage.get(m);
			$.each(opts, function(o, v) {
				opt.options[m][o].val = (values && values[o] != undefined ? values[o] : v.defaultVal);
			});
		});
	}
};

dbg("[Init] Loading modules");
var url = parseUrl(window.location.href);
opt.load();
dbg(url);
dbg(craftUrl(url));
dbg("[Init] Ready");