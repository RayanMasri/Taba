const main = chrome.extension.getURL('index.html');
const container = document.getElementById("sessions");

// Handles left click event on an HTML Element
HTMLElement.prototype.onleft = function(callback) {
    this.addEventListener("click", event => {
        if(event.which == 1) {
            event.preventDefault();
            callback(event);
        }
    })
}

// Handles mouse over event on an HTML Element
HTMLElement.prototype.onover = function(callback) {
    this.addEventListener("mouseover", event => {
        event.preventDefault();
        callback(event);
    })
}

// Handles mouse out event on an HTML Element
HTMLElement.prototype.onout = function(callback) {
    this.addEventListener("mouseout", event => {
        event.preventDefault();
        callback(event);
    })
}

// Gets index of html element according to parent
HTMLElement.prototype.indexof = function() {
    return Array.from(this.parentNode.children).indexOf(this);
}

class Element {
    insert(template, parent) {
        // Create element
        let element = document.createElement('template');
        element.innerHTML = template;

        // Extract references
        let references = {}

        Array.from(element.content.querySelectorAll("*")).map(element => {
            let reference = element.getAttribute("ref");
            if(reference) {                
                references[reference] = element;
                element.removeAttribute("ref");
            }
        })

        // Append template to parent
        parent.appendChild(element.content);

        return {
            element: element,
            references: references
        }
    }

    // Deletes an HTML Element
    destroy(element) {
        element.parentNode.removeChild(element);
    }
}

class Tab extends Element {
    constructor(object) {
        super();
        this.session = object.session;
        this.onchange = object.onchange;
        this.tab = object.tab;

        // Get URL and domain name
        this.url = this.tab.url || this.tab.pendingUrl;
        this.domain = new URL(this.url).hostname;

        // Get favicon
        this.icon = "https://www.google.com/s2/favicons?domain=" + this.domain;      

        this.deleted = false;
    }

    // Restores this Tab
    restore() {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {                
            // Get Taba tab
            for(let tab of tabs) {
                // Create a new tab with this Tab instance's url
                chrome.tabs.create({ url: this.url, index: 1 });

                // Focus back on Taba tab
                chrome.tabs.update(tab.id, { active: true });                                    
            }
        });
    }
    
    // Removes this Tab from the current session storage
    remove() {
        // Load sessions
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // ********** Error handling response: TypeError: Cannot read property 'group' of undefined
            // at <URL>
            let [session, index] = this.session;
            
            // Remove tab from storage array
            sessions[index].group.splice(this.container.indexof(), 1);

            // Save new storage array
            chrome.storage.local.set({"sessions": sessions}, () => {
                // Destroy link html element
                this.destroy(this.container);
                this.deleted = true;

                // Call this session's onchange
                this.onchange.bind(session)();
            });
        });
    }

    // Renders the Tab instance into an HTML Element
    render(parent) {  
        let {_, references} = this.insert(`
            <div ref="container">
                <img src="./assets/close.png" class="tab-delete" ref="close"></img>
                <img src=${this.icon}></img>
                <p ref="text">${this.domain}</p>
            </div>
        `, parent);

        references.text.onleft(() => {
            this.restore();
            this.remove();
        })

        references.container.onover(() => references.close.style.visibility = "visible");
        references.container.onout(() => references.close.style.visibility = "hidden");        
        references.close.onleft(() => this.remove());

        this.container = references.container;
    }
}

class Session extends Element {
    constructor(object) {
        super();
        this.group = object.group.map((tab, index) => {            
            return new Tab({ tab: tab, session: [this, object.index], onchange: this.onchange })
        });
        this.date = object.date;
        this.time = object.time;
        this.index = object.index;
        this.favorite = object.favorite;
    }    

    getstar() {
        return this.favorite ? "./assets/star-fill.png" : "./assets/star-empty.png";
    }

    setfavorite(condition) {
        this.favorite = condition;

        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            sessions[this.index].favorite = this.favorite;

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})
        });
    }

    // Called when a tab is removed/restored from a session
    onchange(tab) {        
        // Update tab title to match tab count
        this.references.title.innerHTML = `${this.references.tabs.children.length} tabs`; 

        // Check if session is still active by finding if there is an active tab
        let alive = this.group.find(tab => !tab.deleted);

        if(!alive) {
            // Delete the session element
            this.destroy(this.references.session);

            // Remove from storage
            this.remove();
        }
    }   

    // Updates session tab count
    getcount() {
        ;
    }

    // Removes session from sessions storage
    remove() {
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            sessions.splice(this.index, 1);

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})
        });
    }

    // Renders the Session instance into an HTML Element
    render(parent) {
        let {_, references} = this.insert(`
            <div class="session" ref="session">
                <div class="session-header" ref="header">
                    <p class="session-title" ref="title">${this.group.length} tabs</p>
                    <p class="session-date">${this.time}</p>
                    <img src=${this.getstar()} ref="star"></img>
                </div>
                <div class="session-tabs" ref="tabs"></div>
            </div>
        `, parent);

        this.references = references;

        // Rendere all tabs
        this.group.map(tab => tab.render(references.tabs));

        references.star.onleft(() => {
            this.setfavorite(!this.favorite);
            references.star.src = this.getstar();
        })        
    }
}

// Load local sessions
chrome.storage.local.get(["sessions"], result => {
    let sessions = result["sessions"] || [];

    // Unpack sessions
    sessions = sessions.map(session => {
        return {
            group: session.group,
            time: session.time,
            favorite: session.favorite,
            date: session.date
        };
    });
    

    // Sort sessions by date
    sessions = sessions.sort((x, y) => {
        return (x.date - y.date > 0 ? -1 : 1);
    });

    // Sort sessions by favorited
    sessions = sessions.sort((x, y) => {
        return (x.favorite === y.favorite) ? 0 : x.favorite ? -1 : 1;
    });

    chrome.storage.local.set({sessions: sessions}, () => {
        // Render sessions
        sessions.map((session, index) => {
            session = new Session({
                group: session.group,
                time: session.time,
                favorite: session.favorite,
                date: session.date,
                index: index
            })

            session.render(container);

            console.log(`${session.group.length} tabs at index ${index}`);
        });
    });

})