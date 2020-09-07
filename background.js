const main = chrome.extension.getURL('index.html');


// Handle context menus
let menus = [];
const createMenu = (object) => {
    menus.push({id: object.id||object.title, callback: object.click||undefined})
    chrome.contextMenus.create({title: object.title, id: object.id||object.title, parentId: object.father||undefined});
}
chrome.contextMenus.onClicked.addListener(info => menus.find(menu => menu.id == info.menuItemId).callback());

createMenu({title: "taba"});
createMenu({title: "remove all", father: "taba", click: () => {
    chrome.storage.local.set({"sessions": []}, () => {
        chrome.tabs.query({currentWindow: true}, tabs => {
            tabs.map(tab => {
                let url = tab.url || tab.pendingUrl;
                if(url == main) {
                    chrome.tabs.reload(tab.id);
                }
            })
        })
    })
}});

// Handle click on icon
chrome.browserAction.onClicked.addListener(() => {
	// Get all tabs in all windows
    chrome.tabs.query({currentWindow: true}, tabs => {
        // Check if main (index.html) exists in any of the tabs
        let maintab = tabs.some((tab) => {
            let url = tab.url || tab.pendingUrl;
            return url == main ? tab : undefined;   
        });

		if(!maintab) {
            // If main doesn't exist, create it
			chrome.tabs.create({url: main, index: tabs.length - 1});
		} else {
            // If main exists, reload it
            chrome.tabs.reload(maintab.id);
        }
        
        // Iterate through tabs
        let group = tabs.filter(tab => {           
            let url = tab.url || tab.pendingUrl;
            
            // Check if tab is not pinned or is main tab
            if(!tab.pinned && url != main) {
                // Remove the tab
                chrome.tabs.remove(tab.id);

                // Check if tab isn't a new tab
                if(url != "chrome://newtab/") {
                    // Collect the tab
                    return tab;
                }
            }
        })     
        
        // Check if group isn't empty
        if(group.length) {
            // Load local sessions
            chrome.storage.local.get(["sessions"], result => {
                let sessions = result["sessions"] || [];
    
                // Get current time
                let date = new Date();
                let time = {
                    hours: date.getHours() > 12 ? date.getHours() - 12 : date.getHours(),
                    minutes: date.getMinutes().toString().padStart(2, '0'),
                    period: date.getHours() >= 12 ? 'PM' : 'AM',
                    day: date.getDate(),
                    month: date.getMonth() + 1,
                    year: date.getFullYear()
                }
                time = `${time.month}/${time.day}/${time.year} ${time.hours}:${time.minutes} ${time.period}`;
                // Push current session
                sessions.push({
                    group: group,
                    time: time,
                    date: date.getTime(),
                    favorite: false
                });
    
                // Save current sessions
                chrome.storage.local.set({"sessions": sessions})
            });
        }
	});
});
