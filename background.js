Number.prototype.pad = function (size) {
	var s = String(this);
	while (s.length < (size || 2)) {
		s = "0" + s;
	}
	return s;
}

function get_time() {
	//return moment().format("MM:DD:YYYY, hh:mm:ss A");
	let today = new Date();
	let date_string = `${(today.getMonth() + 1).pad()}/${today.getDate().pad()}/${today.getFullYear().pad(4)}, ${today.getHours() % 12}:${today.getMinutes().pad()}:${today.getSeconds().pad()} ${today.getHours() > 12 ? "PM" : "AM"}`

	return date_string
}

let newtab_url = "chrome://newtab/"

//detect when extension is clicked
chrome.browserAction.onClicked.addListener(function (tab) {
	let query_info = {
		"currentWindow": true
	}
	let tab_info = {
		"index": 0,
		"url": "index.html"
	}
	//create taba
	//check if taba is already existing
	chrome.tabs.query(query_info, (tabs) => {
		let existing = false;
		for (let i = 0; i < tabs.length; i++) {
			if (tabs[i].url == chrome.extension.getURL('index.html')) {				
				chrome.tabs.update(tabs[i].id, {
					url: tabs[i].url,
				});
				existing = true;
				break;
			}
		}
		if (!existing) 
		{		
			for(let i = 0; i < tabs.length; i++)
			{
				if(tabs[i].pinned)
				{
					tab_info["index"] = i+1;
				} else {
					break;
				}
			}
			chrome.tabs.create(tab_info)
		}
	})

	//-------FIX--------
	//chrome.tabs.getSelected	
	chrome.tabs.query(query_info, (tabs) => {
		let session = []
		for (let i = 1; i < tabs.length; i++) {
			//check if tab isn't pinned
			if (!tabs[i].pinned) {
				try {
					//check if tab isn't taba or an empty new tab or tab's status isn't complete
					// if (!(tabs[i].url == main_url || tabs[i].url == newtab_url || tabs[i].status == 'loading')) {
					if (!(tabs[i].url == chrome.extension.getURL('index.html') || tabs[i].url == newtab_url)) {
						//collect it
						// console.log(`collected tab ${(tabs[i].url || tabs[i].title || tabs[i].pendingUrl)} with status ${tabs[i].status}`);
						session.push(tabs[i])
					}
					//remove it
					chrome.tabs.remove(tabs[i].id)
					// console.log(`removed ${tabs[i].url} with id ${tabs[i].id}`)
				} catch {
					// console.log("could not remove " + tabs[i].url)
				}
			}
		}

		session = [session, get_time(), '', `${session.length} tab${session.length != 1 ? "s" : ""}`, '']

		chrome.storage.local.get({
			'key': []
		}, function (result) {
			let sessions = result.key
			if (!Array.isArray(sessions)) {
				sessions = []
			}

			sessions.push(session)
			//console.log(session)
			chrome.storage.local.set({
				'key': sessions
			});
		});

	});
});

//open taba when opening chrome

// chrome.windows.onCreated.addListener(function (window) {
// 	let tab_info = {
// 		"url": "index.html",
// 		"index": 0

// 	}
// 	chrome.tabs.create(tab_info)
// 	chrome.tabs.query({currentWindow: true}, function(tabs) {
// 		chrome.tabs.update(tabs[0].id, {
// 			selected: true
// 		})
// 	});
// });