const main = chrome.extension.getURL('index.html');

chrome.browserAction.onClicked.addListener(() => {
    // chrome.storage.local.set({"sessions": []});
    // return;
	// Get all tabs in all windows
    chrome.tabs.query({currentWindow: true}, tabs => {
        // Check if main (index.html) exists in any of the tabs
        let maintab = tabs.some((tab) => {
            let url = tab.url || tab.pendingUrl;
            return url == main ? tab : undefined;   
        });

		if(!maintab) {
            // If main doesn't exist, create it
			chrome.tabs.create({url: main, index: 0});
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
                if(url != "chrome://newtab") {
                    // Collect the tab
                    return tab;
                }
            }
        })        

        // Load local sessions
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Get current time
            let date = new Date();
            let time = {
                hours: date.getHours() > 12 ? date.getHours() - 12 : date.getHours(),
                minutes: date.getMinutes().toString().padStart(2, '0'),
                period: date.getHours() >= 12 ? 'PM' : 'AM',
                day: date.getDay(),
                month: date.getDate(),
                year: date.getFullYear()
            }
            time = `${time.hours}:${time.minutes} ${time.period} ${time.day}/${time.month}/${time.year}`;

            // Push current session
            sessions.push({
                group: group,
                time: time,
                title: "title"  
            });

            // Save current sessions
            chrome.storage.local.set({"sessions": sessions})
        });
	});
});
