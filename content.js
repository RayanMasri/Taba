//Check if main is duplicated
chrome.tabs.query({
		active: true,
		currentWindow: true,
	},
	function (selected) {
		let main_url = selected[0].url || selected[0].pendingUrl;
		let main_id = selected[0].id;
		chrome.tabs.query({
				currentWindow: true,
			},
			function (tabs) {
				let duplicates = 0;
				for (let i = 0; i < tabs.length; i++) {
					console.log(tabs[i].url);
					if (tabs[i].url == main_url) {
						duplicates += 1;
					}
				}
				if (duplicates > 1) {
					chrome.tabs.remove(main_id);
				}
			}
		);
	}
);

let container = document.getElementById("container");
// let total = document.getElementById("total-tabs");
let default_icon = "https://www.google.com/s2/favicons?domain=google.com";
let header = document.getElementById("header");

function refresh() {
	chrome.tabs.query({
			active: true,
			currentWindow: true,
		},
		function (tabs) {
			chrome.tabs.update(tabs[0].id, {
				url: tabs[0].url,
			});
		}
	);
}

//check each one the heck
function update_sessions() {
	chrome.storage.local.get({
		'key': [],
	}, function (result) {
		let sessions = result.key;
		let new_sessions = [];
		// let total_tabs = 0;
		for (let i_a = 0; i_a < container.children.length; i_a++) {

			if (container.children[i_a].children[1].children.length <= 0) {
				console.log(`removed session with ${container.children[i_a].children[1].children.length} children`);
				container.removeChild(container.children[i_a]);
				continue;
			} else {
				console.log(`did not remove a session with ${container.children[i_a].children[1].children.length} children`);
			}
			// let session_div = container.children[i_a];
			let session_index = parseInt(container.children[i_a].getAttribute('alt'));
			let session_count = container.children[i_a].children[0].children[1];
			let session_links = container.children[i_a].children[1];
			let session_date = container.children[i_a].children[0].children[2].children[0].textContent;
			let session_name = container.children[i_a].children[0].children[0].value;
			let session_tabs = [];

			let session_countx = `${container.children[i_a].children[1].children.length} tabs`;


			//majority of bugs occur here
			for (let i_b = 0; i_b < session_links.children.length; i_b++) {
				let tab_id = parseInt(session_links.children[i_b].children[2].children[0].getAttribute('alt'));
				console.log(`acquired tab id ${tab_id}`);
				let tab = undefined;
				for (let i_c = 0; i_c < sessions.length; i_c++) {
					let tabs = sessions[i_c][0];
					console.log(`all tabs ${tabs}`);
					for (let i_d = 0; i_d < tabs.length; i_d++) {
						console.log(`matching tab ${tabs[i_d]}`);
						console.log(` his id ${tabs[i_d].id} with ${tab_id}`)
						if (tabs[i_d].id == tab_id) {
							tab = tabs[i_d];
							break
						}
					}
				}
				// console.log(`tab: ${tab}`);
				session_tabs.push(tab)
				// session = [session, get_time(), '', `${session.length} tab${session.length != 1 ? "s" : ""}`]

				// console.log(session_date.textContent);
			}

			session_count.textContent = session_countx;

			new_sessions[session_index] = [session_tabs, session_date, session_name, session_count.textContent];



			// console.log(session_links.children.length);
			// total_tabs += container.children[i_a].children[1].children.length;
		}

		// total.textContent = `Tabs: ${total_tabs}`;

		chrome.storage.local.set({
			'key': new_sessions,
		});
	});
}

function create_link(tab, session, count, indices) {
	let link_main = document.createElement("div");
	link_main.classList.add("link-main");

	session.appendChild(link_main);

	//   session.insertBefore(link_main, session.firstChild);
	//session.children[1].insertAdjacentElement("afterBegin", link_main);

	session = link_main;

	let link_base = document.createElement("div");

	let link = document.createElement("p");
	let remove_button = document.createElement("p");
	let icon = document.createElement("img");
	icon.className = "icon";

	//console.log(`source url: ${(tab.favIconUrl || default_icon)}`)
	icon.setAttribute("src", tab.favIconUrl || default_icon);
	session.appendChild(remove_button);
	session.appendChild(icon);
	link_base.appendChild(link);
	link_base.classList.add("link-base");

	link.className = "link";
	link.setAttribute("alt", tab.id);
	link.textContent = `${tab.title || tab.url || tab.pendingUrl} ${tab.id}`;
	//link.textContent = tab;
	//console.log(`look for title: ${tab.pendingTitle}`)

	//X Button
	remove_button.textContent = "X";
	remove_button.style.visibility = "hidden";
	remove_button.classList.add("remove-button");
	remove_button.addEventListener("click", function () {
		session.parentNode.removeChild(session)
		update_sessions();
	});

	link_base.addEventListener('mouseup', function (event) {
		console.log(`clicked on session link with key ${event.which}`);		
		if (event.which == 1) {
			session.parentNode.removeChild(session)
			update_sessions();
		}
		//acquire id
		chrome.tabs.getSelected(null, function (selected) {
			//console.log(`selected tab url: ${selected.url}`);
			//create tab
			chrome.tabs.create({
				url: tab.url,
				index: 1,
			});
			//remain focused
			chrome.tabs.update(selected.id, {
				selected: true,
			});
		});

	});
	link_main.addEventListener("mouseover", function () {
		//console.log("started hovering over main");
		//remove_button.setAttribute('disabled', false);
		// remove_button.style.display = "block";
		remove_button.style.visibility = "visible";
	});
	link_main.addEventListener("mouseout", function () {
		//console.log("stopped hovering over base");
		//remove_button.setAttribute('disabled', false);
		// remove_button.style.display = "none";
		remove_button.style.visibility = "hidden";
	});

	session.appendChild(link_base);
}
//Getting the data from local storage
chrome.storage.local.get({
		'key': [],
	},
	function (result) {
		let sessions = result.key;
		for (let x = 0; x < sessions.length; x++) {
			if (sessions[x]) {
				if (sessions[x][0].length <= 0) {
					sessions.splice(x, 1);
					chrome.storage.local.set({
						'key': sessions,
					});
					continue;
				}
			} else {
				sessions.splice(x, 1);
				chrome.storage.local.set({
					'key': sessions,
				});
				continue;
			}
			// console.log(`sessions: ${sessions[x]}`);
			let session = sessions[x][0].filter(function (element) {
				return element != null;
			});
			// 	console.log(`sessions after filtered: ${session}`)
			let time = sessions[x][1];
			let session_sname = sessions[x][2];
			let session_length = sessions[x][3];
			let session_xalt = sessions[x][4];

			//if session ?
			if (session.length > 0) {
				//Create session elements
				let session_div = document.createElement("div"); //Holds everything in a session
				let session_header = document.createElement("div"); //Holds the stuff on top
				let session_data = document.createElement("div"); //Holds the stuff on top except the name and amount of tabs
				let session_count = document.createElement("p");
				let session_date = document.createElement("p");
				let session_restore = document.createElement("p");
				let session_delete = document.createElement("p");
				let session_name = document.createElement("input");
				let session_links = document.createElement("div");

				//Give classname to elements
				session_div.className = "session";
				session_div.classList.add("card");
				session_data.className = "session-data";
				session_header.className = "session-header";
				session_count.className = "session-count";
				session_date.className = "session-date";
				session_restore.className = "session-restore";
				session_delete.className = "session-delete";
				session_name.className = "session-name";
				session_links.className = "session-links";

				session_date.textContent = time;
				session_restore.textContent = "Restore All";
				session_delete.textContent = "Delete All";
				session_count.textContent = session_length;
				//session_name.textContent = "Rename";

				session_name.value = session_sname;
				session_name.setAttribute('alt', session_xalt||'');
				session_name.type = "text";
				session_name.tabIndex = '-1'; //prevents focus on tab key
				session_name.style.width = session_name.value.length + "ch";
				session_name.style.marginRight = "5px";
				//session_count.disabled = true;
				//session_count.setAttribute('onkeypress', "this.style.width = ((this.value.length + 1) * 8) + 'px';");

				session_header.appendChild(session_name);
				session_header.appendChild(session_count);
				session_header.appendChild(session_data);
				session_data.appendChild(session_date);
				session_data.appendChild(session_restore);
				session_data.appendChild(session_delete);

				new Sortable(session_links, {
					group: "links",
					animation: 100,
					onEnd: function (event) {
						// console.log(`ended event: ${event}`);
						// console.log(`from: ${event.from.className}`);
						// console.log(`to: ${event.to.className}`);
						// update_tab_count(event.from, event.from.parentNode.children[0].children[1]);
						// update_tab_count(event.to, event.to.parentNode.children[0].children[1]);
						update_sessions();
					},
				});
				// session_div.addEventListener('click', function (event) {
				// 	console.log("clicked on current session");
				// 	let clicked = event.target
				// 	if (clicked.className == "link") {
				// 		console.log("clicked on session link");
				// 		//acquire id
				// 		chrome.tabs.getSelected(null, function (selected) {
				// 			sessions[x][0].map(function (element) {
				// 				if (element.id == parseInt(clicked.getAttribute('alt'))) {
				// 					//create tab
				// 					chrome.tabs.create({
				// 						url: element.url,
				// 					});
				// 					//remain focused
				// 					chrome.tabs.update(selected.id, {
				// 						selected: true
				// 					});
				// 				}
				// 			});

				// 		});

				// 		//remove url from storage
				// 		sessions[x][0].map(function (element, index) {
				// 			if (element.id == parseInt(clicked.getAttribute('alt'))) {
				// 				sessions[x][0].splice(index, 1);
				// 			}
				// 		});
				// 		//sessions[x][0].splice(storage_link, 1);
				// 		chrome.storage.local.set({
				// 			key: sessions
				// 		})
				// 		//remove base
				// 		refresh();
				// 		//instead of refreshing, try getting the link elements link-main and destroying that [sessions dont delete when this is on]
				// 	}
				// 	console.log(event.target.className);
				// });

				// session_rename.addEventListener('click', function() {
				// 	session_count.disabled = "false"
				// 	session_count.focus();
				// });

				session_restore.addEventListener("click", function () {
					//remove from storage
					sessions.splice(x, 1);
					chrome.storage.local.set({
						'key': sessions,
					});
					session_div.parentNode.removeChild(session_div);

					chrome.tabs.getSelected(null, function (selected) {
						//restore tabs
						for (let i = 0; i < session.length; i++) {
							let url = session[i].url;
							chrome.tabs.create({
								url: url,
							});
						}

						//remain focused
						chrome.tabs.update(selected.id, {
							selected: true,
						});
					});
				});

				session_delete.addEventListener("click", function () {
					//remove from storage
					sessions.splice(x, 1);
					chrome.storage.local.set({
						'key': sessions,
					});
					session_div.parentNode.removeChild(session_div);
				});

				session_count.addEventListener("click", function () {
					session_name.focus();
					if (session_name.value.length < 1) {
						session_name.style.width = "1ch";
					}
				});

				session_name.addEventListener("focusin", function () {
					session_name.style.marginRight = "25px";
					console.log(`alt: ${session_name.getAttribute('alt')}`);
					session_name.value = session_name.getAttribute('alt');
				});

				session_name.addEventListener("input", function () {
					console.log("focused");
					session_name.style.width = session_name.value.length + "ch";
				});

				session_name.addEventListener("keyup", function () {
					console.log("focused");
					session_name.style.width = session_name.value.length + "ch";
				});
				session_name.addEventListener("keydown", function () {
					console.log("focused");
					session_name.style.width = session_name.value.length + "ch";
				});

				session_name.addEventListener("focusout", function () {
					console.log("stopped focusing");
					
					session_name.style.marginRight = "5px";
					session_name.setAttribute('alt', session_name.value);
					session_name.value = session_name.value.replace(/\s+/g,' ');
					if (session_name.value.length < 1) {
						session_name.style.width = "0ch";
					} else {
						session_name.style.width = session_name.value.length + "ch";
					}
					sessions[x][2] = session_name.value;
					sessions[x][4] = session_name.getAttribute('alt');
					chrome.storage.local.set({
						'key': sessions,
					});
				});

				session_name.addEventListener("keyup", function (key) {
					if (key.code == "Enter") {
						session_name.blur();
					}
				});

				session_div.setAttribute("alt", x);
				session_div.appendChild(session_header);
				session_div.appendChild(session_links);
				container.insertBefore(session_div, container.firstChild);


				// console.log(`session used: ${session}`);
				for (let y = 0; y < session.length; y++) {
					if (!(session[y] === "")) {
						// console.log(`Creating link: ${session[y].url}`)
						create_link(session[y], session_links, session_count, [x, y]);
					}
				}

			} else {
				sessions.splice(x, 1);
				chrome.storage.local.set({
					'key': sessions,
				});
			}
		}
	}
);