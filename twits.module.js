// This file is part of GKSimproved.

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
modules.twits = {
	name: "twits",
	pages: [
		{ path_name: "/forums.php", params: { action: 'viewtopic' }, options: { buttons: ".bbsmiles", twit_color: { scanArea: "div[id^=content]" }, twit_autoc: { scanArea: "#quickpost" } } },
		{ path_name: "/blog/", params: { id: '*' }, options: { buttons: ".bbsmiles", twit_color: { scanArea: ".blog_comment" }, twit_autoc: { scanArea: "#new_blog_comm" } } }, // Not editable
		{ path_name: "/torrent/\\d+/.*/?", options: { buttons: "p[class=center]:last", twit_color: { scanArea: ".comtable_content" }, twit_autoc: { scanArea: "#quickpost" } } },
		{ path_name: "/com/", params: { id: '*' }, options: { buttons: ".bbsmiles", twit_color: { scanArea: ".comtable_content" }, twit_autoc: { scanArea: "#quickpost" } } }
		//{ path_name: "/com/", params: { editid: '*' }, options: { twit_autoc: { scanArea: "textarea" } } } // Can't autocomplete since we can't build pseudos hashmap
	],
	loaded: false,
	loadModule: function(mOptions) {
		this.loaded = true;
		var module_name = this.name;
		var dbg = function(str) {
			_dbg(module_name, str);
		};

		dbg("[Init] Loading module");

		var twit_auto_complete = opt.get(module_name, "twit_auto_complete");
		var autocKey = 9;
		var iPseudo = false;
		var pseudos = {};
		var pseudos_matchs = [];
		var jOnKeydown = function(e) {
			var qp = $(this)
			var qp_text = qp.val();
			if(twit_auto_complete && e.which == autocKey) {
				dbg("[AutoCTwit] Trying to autoc");

				var matchingAts = qp_text.match(/\B@\w+/g);
				if(!matchingAts) {
					return;
				}

				e.preventDefault();
				var textToAutoc = matchingAts[matchingAts.length - 1]; // Take last match
				if(iPseudo === false) {
					dbg("[AutoCTwit] First tab - Build array");
					var originalText = textToAutoc; // Save the original text in order to include in tab rotation
					var lowerOriginalText = originalText.substring(1).toLowerCase(); // Pre lowerCase - Avoid it in loop
					iPseudo = 0; // Reset pos in array - Indicates we're actively rotating through the array
					pseudos_matchs = [];
					$.each(pseudos, function(lowerPseudo, userData) {
						if(lowerPseudo.indexOf(lowerOriginalText) === 0) {
							pseudos_matchs.push("@" + userData.pseudo); // Simple array, easier to loop
						}
					});
					pseudos_matchs.sort(); // Alphabetical sort
					pseudos_matchs.unshift(originalText); // Insert original text at 0
				}

				if(pseudos_matchs.length == 1) {
					return;
				}

				var nextIPseudo = (iPseudo >= pseudos_matchs.length - 1 ? 0 : iPseudo + 1); // Getting next i
				dbg("[AutoCTwit] Found a match : " + pseudos_matchs[nextIPseudo]);
				qp.val(qp_text.replace(new RegExp(pseudos_matchs[iPseudo] + "\\b"), pseudos_matchs[nextIPseudo])); // \b and \B are a complete mess, but it works pretty well
				iPseudo = nextIPseudo;
			}
			else {
				iPseudo = false;
			}
		};

		var twit_color = opt.get(module_name, "twit_color");
		var colorizeTwits = function(postId) {
			var postArea = $(mOptions.twit_color.scanArea);
			if(arguments.length) {
				postArea = $("#content" + postId);
			}
			dbg("[TwitColorize] Colorization start");
			postArea.each(function() {
				var post = $(this);
				post.html(post.html().replace(/\B@([\w]+)/gi, function(match, m1) {
					var user = pseudos[m1.toLowerCase()];
					if(user) {
						dbg("[TwitColorize] Found a match : " + m1);
						return '@<a href="' + user.url + '"><span class="' + user.class + '">' + m1 + '</span></a>';
					}
					else {
						return match;
					}
				}));
			});
			dbg("[TwitColorize] Colorization ended");
		};

		dbg("[Init] Starting");
		// Adding buttons
		$(mOptions.buttons).before('<div id="gksi_twit_buttons" style="text-align:right;"><input type="checkbox" id="twit_autoc" ' + (twit_auto_complete ? 'checked="checked"' : '') + '/> Auto-complétion des twits | <input type="checkbox" id="twit_color" ' + (twit_color ? 'checked="checked"' : '') + '/> Coloration des twits <br /></style>');
		if(!$(mOptions.twit_autoc.scanArea).length) {
			$("#gksi_twit_buttons").hide();
		}

		// Twit autocomplete
		$("#twit_autoc").change(function() {
			twit_auto_complete = $(this).attr("checked") == "checked" ? true : false;
			dbg("[AutoCTwit] is " + twit_auto_complete);
			opt.set(module_name, "twit_auto_complete", twit_auto_complete);
		});
		$("#twit_autoc").bind("reactivateKeydownListenner", function() {
			dbg("[AutoCTwit] Retry to bind");
			$(mOptions.twit_autoc.scanArea).keydown(jOnKeydown);
			$("#gksi_twit_buttons").show();
		});
		if(mOptions.twit_autoc) {
			$(mOptions.twit_autoc.scanArea).keydown(jOnKeydown);
		}
		// On edit button click
		$("#forums").on("click", "a[href^=#post]", function() {
			var postId = $(this).attr("href").substr(5);
			// If the editbox poped
			if($("#editbox" + postId).length) {
				dbg("[AutoCTwit] Editbox poped (" + postId + ") - Listening to keydown");
				// Listen for twit autocomplete in editbox
				$("#editbox" + postId).keydown(jOnKeydown);

				var waitMore = function(postId) {
					if($("#editbox" + postId).length) {
						setTimeout(waitMore, 100, postId);
						return;
					}
					else {
						dbg("[TwitColorize] Edit is done - Colorize");
						colorizeTwits(postId);
					}
				}
				var bindEditButton = function() {
					// On edit validation
					$("#bar" + postId + " input:nth(1)").click(function() {
						// Can't track DOM modification event, just wait a reasonnable amount of time to colorize the edited message
						waitMore(postId);
					});
				};
				var bindPrevButton = function() {
					$("#bar" + postId + " input:nth(0)").click(function() {
						bindEditButton();
						bindPrevButton();
					});
				};

				bindEditButton();
				bindPrevButton();
			}
		});

		// Building pseudos hashmap
		$('span[class^=userclass]').each(function() {
			pseudos[$(this).text().toLowerCase()] = { pseudo: $(this).text(), class: $(this).attr("class"), url: $(this).parent().attr("href") };
		});

		// Twit colorization
		$("#twit_color").change(function() {
			twit_color = $(this).attr("checked") == "checked" ? true : false;
			dbg("[TwitColorize] is " + twit_color);
			opt.set(module_name, "twit_color", twit_color);
		});
		if(mOptions.twit_color) {
			colorizeTwits();
		}

		dbg("[Init] Ready");
	}
};